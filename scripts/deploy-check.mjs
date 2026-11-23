/**
 * Verificações do deploy em produção (SOMENTE LEITURA — não grava nada em lugar nenhum).
 * Passo a passo completo: docs/deploy.md (e a skill .claude/skills/deploy).
 *
 *   npm run deploy:check                    # antes: git, PR/CI, migrations pendentes, variáveis novas, produção no ar
 *   npm run deploy:check -- --pr 12         # idem, olhando um PR específico
 *   npm run deploy:check -- --skip-tests    # pula o `npm run check` local (o CI já rodou)
 *   npm run deploy:check -- post --sha <commit> [--timeout 600]
 *                                           # depois do merge: espera o deploy de produção do commit e faz smoke test
 *
 * Sai com código 1 se houver bloqueio (❌). Avisos (⚠️) exigem decisão de quem faz o deploy.
 * URL de produção: DEPLOY_PRODUCTION_URL ou NEXT_PUBLIC_APP_URL, senão https://banda-app.vercel.app.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { argValue, connectDb, hasFlag } from "./db.mjs";
import { envKeys, migrationPlan, riskyStatements } from "./deploy-rules.mjs";

const REPO = "obrunoalbano/banda-app";
const PRODUCTION_URL = (
  process.env.DEPLOY_PRODUCTION_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://banda-app.vercel.app"
).replace(/\/+$/, "");

let blocked = false;
const ok = (msg) => console.log(`✅ ${msg}`);
const warn = (msg) => console.log(`⚠️  ${msg}`);
const fail = (msg) => {
  blocked = true;
  console.log(`❌ ${msg}`);
};
const section = (title) => console.log(`\n── ${title}`);

function run(cmd, args, { allowFail = false } = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  } catch (error) {
    if (allowFail) return null;
    throw error;
  }
}
const gh = (args) => run("gh", args, { allowFail: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Antes do deploy ──────────────────────────────────────────────── */

function checkGit() {
  section("Git");
  run("git", ["fetch", "--quiet", "origin", "main"], { allowFail: true });
  const branch = run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const dirty = run("git", ["status", "--porcelain"])
    .split("\n")
    .filter((l) => l && !l.endsWith(".claude/launch.json") && !l.endsWith(".claude/"));
  if (dirty.length) fail(`Alterações não commitadas (${dirty.length} arquivo(s)) — commite ou descarte antes do deploy.`);
  else ok(`Árvore limpa · branch ${branch}`);

  const ahead = run("git", ["rev-list", "--count", "origin/main..HEAD"]);
  const unpushed = run("git", ["rev-list", "--count", "@{u}..HEAD"], { allowFail: true });
  if (unpushed && unpushed !== "0") fail(`${unpushed} commit(s) sem push.`);
  if (branch === "main") {
    if (ahead !== "0") fail("Commits direto na main local: suba por um PR.");
    else ok("main local igual à origin/main (o deploy sai de um PR)");
  } else {
    ok(`${ahead} commit(s) à frente da main`);
  }
  return branch;
}

function checkPr(branch) {
  section("Pull request e CI");
  const prArg = argValue("pr") ?? (branch === "main" ? null : branch);
  if (!prArg) {
    warn("Nenhum PR informado (use --pr <número>).");
    return null;
  }
  const raw = gh(["pr", "view", prArg, "--repo", REPO, "--json", "number,url,state,isDraft,mergeable,baseRefName,headRefOid,statusCheckRollup"]);
  if (!raw) {
    fail(`PR não encontrado para "${prArg}". Abra o PR antes do deploy.`);
    return null;
  }
  const pr = JSON.parse(raw);
  console.log(`   ${pr.url}`);
  if (pr.state !== "OPEN") fail(`PR está ${pr.state}.`);
  if (pr.isDraft) fail("PR é rascunho (draft).");
  if (pr.baseRefName !== "main") fail(`PR aponta para ${pr.baseRefName}, não main.`);
  if (pr.mergeable === "CONFLICTING") fail("PR tem conflito com a main.");
  const local = run("git", ["rev-parse", "HEAD"]);
  if (branch !== "main" && pr.headRefOid !== local) warn("O commit do PR no GitHub é diferente do HEAD local.");

  // Só os checks de CI do GitHub Actions decidem; o preview da Vercel é informativo.
  const checks = pr.statusCheckRollup ?? [];
  const failing = checks.filter((c) => ["FAILURE", "ERROR", "CANCELLED", "TIMED_OUT"].includes(c.conclusion ?? c.state));
  const pending = checks.filter((c) => (c.status && c.status !== "COMPLETED") || c.state === "PENDING");
  if (failing.length) fail(`CI falhando: ${failing.map((c) => c.name ?? c.context).join(", ")}`);
  else if (pending.length) fail(`CI ainda rodando: ${pending.map((c) => c.name ?? c.context).join(", ")} — espere terminar.`);
  else if (checks.length === 0) warn("Nenhum check de CI encontrado no PR.");
  else ok(`CI verde (${checks.length} check(s))`);
  return pr;
}

function checkLocalTests() {
  section("Checagem local");
  if (hasFlag("skip-tests")) {
    warn("Pulada (--skip-tests).");
    return;
  }
  const result = spawnSync("npm", ["run", "check", "--silent"], { encoding: "utf8" });
  if (result.status === 0) ok("npm run check (lint, typecheck, testes)");
  else {
    console.log((result.stdout + result.stderr).split("\n").slice(-15).join("\n"));
    fail("npm run check falhou.");
  }
}

async function checkMigrations() {
  section("Migrations (produção, leitura)");
  const local = readdirSync("prisma/migrations", { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  let applied;
  let failedRows = [];
  const client = await connectDb({ readOnly: true });
  try {
    const rows = (
      await client.query(`SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations`)
    ).rows;
    applied = rows.filter((r) => r.finished_at && !r.rolled_back_at).map((r) => r.migration_name);
    failedRows = rows.filter((r) => !r.finished_at && !r.rolled_back_at).map((r) => r.migration_name);
  } finally {
    await client.end();
  }
  if (!client.host || ["127.0.0.1", "localhost"].includes(client.host)) {
    warn("A conexão é LOCAL — o .env.local deveria apontar para produção. Migrations de produção não conferidas.");
  }
  if (failedRows.length) fail(`Migration com falha em produção: ${failedRows.join(", ")} — resolva antes (prisma migrate resolve).`);

  const { pending, unknown } = migrationPlan(local, applied);
  if (unknown.length) fail(`Produção tem migrations que não existem no código: ${unknown.join(", ")}`);
  if (pending.length === 0) {
    ok("Nenhuma migration pendente");
    return [];
  }
  console.log(`   Pendentes (${pending.length}) — rodar com \`npm run db:deploy\` ANTES do merge:`);
  for (const name of pending) {
    const risky = riskyStatements(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    console.log(`   • ${name}`);
    for (const r of risky) warn(`  ${name}: ${r.reason} — ${r.statement}`);
  }
  if (pending.some((n) => riskyStatements(readFileSync(`prisma/migrations/${n}/migration.sql`, "utf8")).length)) {
    warn("Há comandos não retrocompatíveis: o código antigo pode quebrar entre a migration e o fim do deploy. Planeje (expandir/contrair).");
  }
  return pending;
}

function checkEnv() {
  section("Variáveis de ambiente");
  const current = envKeys(readFileSync(".env.example", "utf8"));
  const before = run("git", ["show", "origin/main:.env.example"], { allowFail: true });
  const added = before ? current.filter((k) => !envKeys(before).includes(k)) : [];
  if (added.length) {
    warn(`Variáveis NOVAS neste deploy (confira na Vercel → Settings → Environment Variables → Production): ${added.join(", ")}`);
  } else {
    ok("Nenhuma variável nova no .env.example");
  }
  // Mudanças de texto também importam (ex.: variável opcional que virou obrigatória).
  const changed = (run("git", ["diff", "-U0", "origin/main", "--", ".env.example"], { allowFail: true }) ?? "")
    .split("\n")
    .filter((l) => /^[+-][^+-]/.test(l));
  if (changed.length) {
    warn("O .env.example mudou neste deploy — leia e confira na Vercel:");
    for (const line of changed) console.log(`     ${line}`);
  }
  console.log(`   Referência (.env.example): ${current.join(", ")}`);
  return added;
}

async function checkProductionUp() {
  section("Produção agora");
  const res = await fetch(`${PRODUCTION_URL}/login`, { redirect: "manual" }).catch(() => null);
  if (res?.status === 200) ok(`${PRODUCTION_URL} no ar`);
  else warn(`${PRODUCTION_URL}/login respondeu ${res?.status ?? "sem resposta"}`);
  const current = latestProductionDeployment();
  if (current) console.log(`   Deploy atual: ${current.sha.slice(0, 7)} (${current.created_at})`);
}

function latestProductionDeployment(sha) {
  const query = ["api", "-X", "GET", `repos/${REPO}/deployments`, "-f", "environment=Production", "-f", "per_page=10"];
  if (sha) query.push("-f", `sha=${sha}`);
  const raw = gh(query);
  const list = raw ? JSON.parse(raw) : [];
  return list[0] ?? null;
}

/* ── Depois do merge ──────────────────────────────────────────────── */

async function waitForDeployment(sha, timeoutMs) {
  section(`Deploy de produção do commit ${sha.slice(0, 7)}`);
  const start = Date.now();
  let lastState = "";
  while (Date.now() - start < timeoutMs) {
    const deployment = latestProductionDeployment(sha);
    if (deployment) {
      const statuses = JSON.parse(gh(["api", `repos/${REPO}/deployments/${deployment.id}/statuses`]) ?? "[]");
      const state = statuses[0]?.state ?? "pending";
      if (state !== lastState) console.log(`   ${new Date().toLocaleTimeString("pt-BR")} · ${state}`);
      lastState = state;
      if (state === "success") {
        ok(`Vercel publicou ${sha.slice(0, 7)} em produção`);
        return true;
      }
      if (["failure", "error"].includes(state)) {
        fail(`Deploy na Vercel terminou com "${state}": ${statuses[0]?.target_url ?? ""}`);
        return false;
      }
    } else if (!lastState) {
      console.log("   aguardando a Vercel registrar o deploy…");
      lastState = "waiting";
    }
    await sleep(15_000);
  }
  fail(`Tempo esgotado (${Math.round(timeoutMs / 60_000)} min) esperando o deploy.`);
  return false;
}

/** Smoke test: rotas públicas e proteção de rotas privadas. Só GET, sem login. */
async function smokeTest() {
  section(`Smoke test · ${PRODUCTION_URL}`);
  const checks = [
    ["/login", [200]],
    ["/cadastro", [200]],
    ["/esqueci-senha", [200]],
    ["/redefinir-senha?token=invalido", [200]],
    ["/casas", [302, 307]], // protegida → redireciona para /login
    ["/financeiro", [302, 307]],
    ["/api/shows", [401, 405]], // API protegida sem sessão
    ["/embed.js", [200]],
  ];
  for (const [path, expected] of checks) {
    const res = await fetch(`${PRODUCTION_URL}${path}`, { redirect: "manual" }).catch(() => null);
    const status = res?.status ?? 0;
    if (expected.includes(status)) ok(`${path} → ${status}`);
    else fail(`${path} → ${status || "sem resposta"} (esperado ${expected.join("/")})`);
  }
  const html = await fetch(`${PRODUCTION_URL}/login`).then((r) => r.text()).catch(() => "");
  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  if (title) console.log(`   Título de /login: "${title}"`);
}

/* ── Main ─────────────────────────────────────────────────────────── */

const mode = process.argv[2] === "post" ? "post" : "pre";

if (mode === "pre") {
  console.log(`Verificação pré-deploy · produção: ${PRODUCTION_URL}`);
  const branch = checkGit();
  checkPr(branch);
  checkLocalTests();
  await checkMigrations();
  checkEnv();
  await checkProductionUp();
} else {
  const sha = argValue("sha") ?? run("git", ["rev-parse", "origin/main"]);
  const timeoutMs = Number(argValue("timeout") ?? 600) * 1000;
  if (await waitForDeployment(sha, timeoutMs)) await smokeTest();
}

console.log(blocked ? "\n❌ Há bloqueios — não siga com o deploy." : "\n✅ Sem bloqueios.");
process.exit(blocked ? 1 : 0);
