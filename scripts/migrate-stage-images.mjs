/**
 * Copia as imagens dos palcos para o nosso storage em versões otimizadas (WebP):
 * capa até 800px (imageUrl) + miniatura 400×300 (imageThumbUrl). Retomável: pula o que já migrou.
 *
 *   node scripts/migrate-stage-images.mjs --hosts <bucket-da-equipe> --dry-run
 *   node scripts/with-local-db.mjs node scripts/migrate-stage-images.mjs --hosts <host> --limit 50     # local
 *   npm run stages:images -- --hosts <host> --drop-others --confirm-remote                            # produção (Supabase)
 *
 * Opções:
 *   --hosts <h1,h2>   hosts de origem autorizados (obrigatório) — ex.: o bucket R2 da equipe
 *   --drop-others     remove o link de imagens de outros hosts (direito de imagem incerto)
 *   --clear-broken    remove o link de imagens que falharem com 404/410
 *   --storage local|supabase   padrão: local no banco local, supabase no remoto
 *   --limit N · --concurrency N (padrão 6) · --dry-run
 */
import { createHash } from "node:crypto";
import sharp from "sharp";
import { imageHost, isAllowedImageHost, STAGE_IMAGE, stageImagePaths } from "../lib/stage-images.ts";
import { argValue, connectDb, hasFlag } from "./db.mjs";
import { createStorage } from "./storage.mjs";

const hosts = (argValue("hosts") ?? "").split(",").map((h) => h.trim()).filter(Boolean);
if (!hosts.length) {
  console.error("Informe --hosts <host-do-bucket-da-equipe> (ex.: pub-xxxx.r2.dev).");
  process.exit(1);
}
const limit = Number(argValue("limit") ?? 0) || Infinity;
const concurrency = Math.max(1, Math.min(Number(argValue("concurrency") ?? 6) || 6, 16));
const dryRun = hasFlag("dry-run");

const client = await connectDb();
const isLocalDb = ["127.0.0.1", "localhost"].includes(client.host);
const driver = argValue("storage") ?? (isLocalDb ? "local" : "supabase");

const { rows: pending } = await client.query(
  `SELECT id, "imageUrl" FROM "Stage" WHERE "imageUrl" IS NOT NULL AND "imageThumbUrl" IS NULL ORDER BY "createdAt"`,
);
const ours = pending.filter((s) => isAllowedImageHost(s.imageUrl, hosts));
const others = pending.filter((s) => !isAllowedImageHost(s.imageUrl, hosts));
const byHost = others.reduce((acc, s) => ((acc[imageHost(s.imageUrl) ?? "inválida"] = (acc[imageHost(s.imageUrl) ?? "inválida"] ?? 0) + 1), acc), {});
console.log(`Pendentes: ${pending.length} · do(s) host(s) autorizado(s): ${ours.length} · de outros hosts: ${others.length}`);
if (others.length) console.log("Outros hosts:", Object.entries(byHost).sort((a, b) => b[1] - a[1]).slice(0, 8));
console.log(`Destino: ${driver} · concorrência ${concurrency}${Number.isFinite(limit) ? ` · limite ${limit}` : ""}`);

if (dryRun) {
  console.log("--dry-run: nada foi baixado nem gravado.");
  await client.end();
  process.exit(0);
}

const storage = await createStorage(driver);
console.log(`Storage: ${storage.describe}`);

if (hasFlag("drop-others") && others.length) {
  const res = await client.query(`UPDATE "Stage" SET "imageUrl" = NULL, "updatedAt" = now() WHERE id = ANY($1)`, [
    others.map((s) => s.id),
  ]);
  console.log(`Links de outros hosts removidos: ${res.rowCount}`);
}

const queue = ours.slice(0, limit);
const failures = {};
let done = 0;
let migrated = 0;
let bytesIn = 0;
let bytesOut = 0;

async function download(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) }).catch((e) => ({ ok: false, status: e.name }));
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > STAGE_IMAGE.maxDownloadBytes) throw Object.assign(new Error("grande demais"), { reason: "grande demais" });
      return buf;
    }
    if (res.status === 404 || res.status === 410) throw Object.assign(new Error("não encontrada"), { reason: `HTTP ${res.status}` });
    if (attempt === 3) throw Object.assign(new Error("falha"), { reason: `HTTP ${res.status}` });
    await new Promise((r) => setTimeout(r, 1000 * attempt)); // rate limit do r2.dev: espera e tenta de novo
  }
}

async function processStage(stage) {
  try {
    const original = await download(stage.imageUrl);
    const img = sharp(original, { failOn: "error" }).rotate(); // respeita EXIF
    const cover = await img
      .clone()
      .resize({ width: STAGE_IMAGE.cover.maxSide, height: STAGE_IMAGE.cover.maxSide, fit: "inside", withoutEnlargement: true })
      .webp({ quality: STAGE_IMAGE.cover.quality })
      .toBuffer();
    const thumb = await img
      .clone()
      .resize({ width: STAGE_IMAGE.thumb.width, height: STAGE_IMAGE.thumb.height, fit: "cover" })
      .webp({ quality: STAGE_IMAGE.thumb.quality })
      .toBuffer();
    const hash = createHash("sha256").update(original).digest("hex");
    const paths = stageImagePaths(stage.id, hash);
    const [coverUrl, thumbUrl] = await Promise.all([storage.put(paths.cover, cover), storage.put(paths.thumb, thumb)]);
    await client.query(`UPDATE "Stage" SET "imageUrl" = $1, "imageThumbUrl" = $2, "updatedAt" = now() WHERE id = $3`, [
      coverUrl,
      thumbUrl,
      stage.id,
    ]);
    migrated++;
    bytesIn += original.length;
    bytesOut += cover.length + thumb.length;
  } catch (error) {
    const reason = error.reason ?? (error.message?.includes("Input buffer") ? "imagem inválida" : error.message?.slice(0, 60));
    failures[reason] = (failures[reason] ?? 0) + 1;
    if (hasFlag("clear-broken") && /HTTP 4(04|10)|imagem inválida/.test(reason)) {
      await client.query(`UPDATE "Stage" SET "imageUrl" = NULL, "updatedAt" = now() WHERE id = $1`, [stage.id]);
    }
  } finally {
    done++;
    if (done % 25 === 0 || done === queue.length) {
      process.stdout.write(`\r  ${done}/${queue.length} processadas · ${migrated} migradas`);
    }
  }
}

const started = Date.now();
let next = 0;
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next < queue.length) await processStage(queue[next++]);
  }),
);
const mb = (n) => (n / 1024 / 1024).toFixed(1);
console.log(
  `\nConcluído em ${((Date.now() - started) / 1000).toFixed(0)}s: ${migrated} migradas · ` +
    `${mb(bytesIn)} MB originais → ${mb(bytesOut)} MB otimizados (capa + miniatura)`,
);
if (Object.keys(failures).length) console.log("Falhas:", failures, hasFlag("clear-broken") ? "(links quebrados removidos)" : "");
await client.end();
