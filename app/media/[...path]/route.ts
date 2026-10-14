import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";

/**
 * SÓ DESENVOLVIMENTO: serve arquivos gravados pelo storage "local" dos scripts (.local-media/),
 * para validar imagens de palco sem Supabase. Em produção as imagens vêm do Supabase Storage.
 */
const ROOT = join(process.cwd(), ".local-media");

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  // Produção real: desligado. `with-local-db.mjs` liga com SERVE_LOCAL_MEDIA=1 (next start local).
  if (process.env.NODE_ENV === "production" && process.env.SERVE_LOCAL_MEDIA !== "1") {
    return new Response("Not found", { status: 404 });
  }
  const rel = normalize((await context.params).path.join("/"));
  if (rel.startsWith("..") || !rel.endsWith(".webp")) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(join(ROOT, rel));
    return new Response(data, { headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=3600" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
