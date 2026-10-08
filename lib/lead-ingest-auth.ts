import { createHash, randomBytes } from "node:crypto";

/** Extrai token enviado pelo site externo (Bearer ou header dedicado). */
export function extractLeadIngestToken(request: Request): string | null {
  const raw = request.headers.get("x-lead-token")?.trim();
  if (raw) return raw;

  const auth = request.headers.get("authorization")?.trim();
  if (!auth) return null;
  const lower = auth.toLowerCase();
  if (!lower.startsWith("bearer ")) return null;
  const token = auth.slice(7).trim();
  return token || null;
}

/**
 * O banco guarda só o SHA-256 (hex) do token. Token é aleatório de 256 bits, então hash
 * simples (sem salt) é suficiente e permite lookup direto por índice único.
 */
export function hashLeadIngestToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateLeadIngestToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashLeadIngestToken(token) };
}
