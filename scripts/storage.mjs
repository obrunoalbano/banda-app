/**
 * Destino dos arquivos dos scripts (imagens de palco).
 * - local:    grava em .local-media/ (fora do git); servido em /media/... só em desenvolvimento.
 * - supabase: Supabase Storage (bucket público). Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 *             (chave de serviço: só no servidor/terminal, nunca no navegador).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const LOCAL_DIR = new URL("../.local-media/", import.meta.url).pathname;

export async function createStorage(driver, { bucket = "media" } = {}) {
  if (driver === "local") {
    return {
      describe: `local (${LOCAL_DIR})`,
      async put(path, data) {
        const file = join(LOCAL_DIR, path);
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, data);
        return `/media/${path}`;
      },
    };
  }
  if (driver !== "supabase") throw new Error(`storage desconhecido: ${driver}`);

  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) {
    throw new Error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local para usar o Supabase Storage.");
  }
  const headers = { Authorization: `Bearer ${key}`, apikey: key };

  // Garante bucket público (idempotente: 409/400 "already exists" é ok).
  const created = await fetch(`${base}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: bucket, name: bucket, public: true, allowed_mime_types: ["image/webp"] }),
  });
  if (!created.ok && ![400, 409].includes(created.status)) {
    throw new Error(`Não foi possível criar o bucket "${bucket}": HTTP ${created.status} ${await created.text()}`);
  }

  return {
    describe: `supabase (${new URL(base).hostname}, bucket "${bucket}")`,
    async put(path, data) {
      const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "image/webp", "x-upsert": "true", "cache-control": "31536000" },
        body: data,
      });
      if (!res.ok) throw new Error(`upload ${path}: HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
      return `${base}/storage/v1/object/public/${bucket}/${path}`;
    },
  };
}
