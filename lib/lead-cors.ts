/**
 * CORS opcional para ingestão no browser (origin permitido via env).
 * Formato: `LEADS_INGEST_ALLOWED_ORIGINS=https://sitea.com,https://siteb.com`
 */
export function leadIngestCorsHeaders(request: Request): HeadersInit | undefined {
  const raw = process.env.LEADS_INGEST_ALLOWED_ORIGINS?.trim();
  if (!raw) return undefined;

  const origins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!origins.length) return undefined;

  const origin = request.headers.get("origin");
  if (!origin || !origins.includes(origin)) return undefined;

  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Lead-Token",
    "Access-Control-Max-Age": "86400",
  };
}
