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
