/**
 * Importa palcos em lote para a base curada (Stage) a partir de um JSON da equipe.
 *
 *   node scripts/import-stages.mjs --file venues.json --dry-run                      # relatório, não grava
 *   node scripts/with-local-db.mjs node scripts/import-stages.mjs --file venues.json  # banco local
 *   npm run stages:import -- --file venues.json --confirm-remote --admin-email voce@empresa.com
 *
 * Opções:
 *   --source <nome>        origem (padrão "base-equipe"); com o id da origem forma a chave de reimportação
 *   --status PUBLISHED|DRAFT  situação dos NOVOS palcos (padrão PUBLISHED)
 *   --source-note "<texto>"   fonte registrada em cada palco (padrão: base própria da equipe + arquivo + data)
 *   --admin-email <email>  quem fica como responsável pelo cadastro/verificação
 *
 * Reimportar a mesma origem ATUALIZA os dados (nome, contatos, imagem…) mas NÃO mexe na curadoria
 * (situação, verificação): um palco arquivado pela equipe continua arquivado.
 * Formato aceito: lista de objetos ou { venues: [...] } com id, name, type, state, city, phone,
 * whatsapp, instagram, imageUrl, verified (0/1), lastActivity, created_at.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { dedupeKey, toStageImportRow } from "../lib/stage-import.ts";
import { argValue, connectDb, hasFlag } from "./db.mjs";

const file = argValue("file");
if (!file) {
  console.error("Uso: node scripts/import-stages.mjs --file <arquivo.json> [--dry-run] [--status PUBLISHED|DRAFT]");
  process.exit(1);
}
const source = argValue("source") ?? "base-equipe";
const status = (argValue("status") ?? "PUBLISHED").toUpperCase();
if (!["PUBLISHED", "DRAFT"].includes(status)) {
  console.error("--status deve ser PUBLISHED ou DRAFT");
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
const sourceNote = argValue("source-note") ?? `Base própria da equipe do app — importação de ${basename(file)} em ${today}`;

// ── Leitura e normalização ─────────────────────────────────────────
const parsed = JSON.parse(readFileSync(file, "utf8"));
const raws = Array.isArray(parsed) ? parsed : parsed.venues;
if (!Array.isArray(raws)) {
  console.error("JSON precisa ser uma lista ou { venues: [...] }.");
  process.exit(1);
}

const rows = [];
const rejected = {};
const seen = new Map();
let duplicates = 0;
for (const raw of raws) {
  const r = toStageImportRow(raw);
  if (!r.ok) {
    rejected[r.reason] = (rejected[r.reason] ?? 0) + 1;
    continue;
  }
  const key = dedupeKey(r.row);
  if (seen.has(key)) {
    duplicates++;
    continue;
  }
  seen.set(key, true);
  rows.push(r.row);
}

const count = (fn) => rows.reduce((acc, r) => ((acc[fn(r)] = (acc[fn(r)] ?? 0) + 1), acc), {});
const top = (obj, n = 10) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
console.log(`\nArquivo: ${file} — ${raws.length} registros`);
console.log(`Válidos: ${rows.length} · duplicados ignorados: ${duplicates} · rejeitados: ${JSON.stringify(rejected)}`);
console.log("Por tipo:", top(count((r) => r.type)));
console.log("Por UF (top 10):", top(count((r) => r.state)));
console.log(`Com bairro separado da cidade: ${rows.filter((r) => r.neighborhood).length}`);
console.log(
  `Com WhatsApp: ${rows.filter((r) => r.whatsapp).length} · telefone: ${rows.filter((r) => r.publicPhone).length} · ` +
    `Instagram: ${rows.filter((r) => r.instagram).length} · imagem: ${rows.filter((r) => r.imageUrl).length} · ` +
    `verificados na origem: ${rows.filter((r) => r.verified).length}`,
);
console.log(`Novos palcos entram como: ${status}. Origem: "${source}". Fonte: "${sourceNote}"`);

if (hasFlag("dry-run")) {
  console.log("\n--dry-run: nada foi gravado.");
  process.exit(0);
}

// ── Gravação (upsert em lotes, numa transação) ─────────────────────
const client = await connectDb();
let adminId = null;
const adminEmail = argValue("admin-email");
if (adminEmail) {
  const a = await client.query(`SELECT id FROM "AdminUser" WHERE email = $1`, [adminEmail.toLowerCase()]);
  if (!a.rowCount) {
    console.error(`Administrador ${adminEmail} não encontrado.`);
    process.exit(1);
  }
  adminId = a.rows[0].id;
}

const COLS = 20;
const now = new Date();
let inserted = 0;
let updated = 0;
try {
  await client.query("BEGIN");
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const values = [];
    const params = [];
    chunk.forEach((r, j) => {
      const b = j * COLS;
      values.push(
        `($${b + 1}, $${b + 2}, $${b + 3}::"StageType", $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8}, $${b + 9}, $${b + 10}, ` +
          `$${b + 11}, $${b + 12}::"StageStatus", $${b + 13}, $${b + 14}, $${b + 15}, $${b + 16}, $${b + 17}, $${b + 18}, $${b + 19}, $${b + 20})`,
      );
      // Publicado: só quem a equipe marcou como verificado na origem ganha data de verificação;
      // os demais aparecem na fila "Reverificar" do painel.
      const verifiedAt = status === "PUBLISHED" && r.verified ? now : null;
      params.push(
        randomUUID(), r.name, r.type, r.city, r.state, r.instagram, r.publicPhone, r.whatsapp, r.imageUrl,
        r.lastActivityAt, sourceNote, status, verifiedAt, verifiedAt ? adminId : null, adminId,
        source, r.externalId, r.createdAt ?? now, now, r.neighborhood,
      );
    });
    const res = await client.query(
      `INSERT INTO "Stage" (id, name, type, city, state, instagram, "publicPhone", whatsapp, "imageUrl",
         "lastActivityAt", "sourceNote", status, "verifiedAt", "verifiedById", "createdById",
         "externalSource", "externalId", "createdAt", "updatedAt", neighborhood)
       VALUES ${values.join(", ")}
       ON CONFLICT ("externalSource", "externalId") DO UPDATE SET
         name = EXCLUDED.name, type = EXCLUDED.type, city = EXCLUDED.city, state = EXCLUDED.state,
         neighborhood = EXCLUDED.neighborhood,
         instagram = EXCLUDED.instagram, "publicPhone" = EXCLUDED."publicPhone", whatsapp = EXCLUDED.whatsapp,
         "imageUrl" = EXCLUDED."imageUrl", "lastActivityAt" = EXCLUDED."lastActivityAt",
         "sourceNote" = EXCLUDED."sourceNote", "updatedAt" = EXCLUDED."updatedAt"
       RETURNING (xmax = 0) AS inserted`,
      params,
    );
    for (const row of res.rows) {
      if (row.inserted) inserted++;
      else updated++;
    }
    process.stdout.write(`\r  gravados ${Math.min(i + 500, rows.length)}/${rows.length}`);
  }
  await client.query("COMMIT");
  console.log(`\nConcluído: ${inserted} novos, ${updated} atualizados (curadoria preservada).`);
} catch (error) {
  await client.query("ROLLBACK");
  console.error("\nErro — nada foi gravado:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
