import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { PUBLIC_SHOWS_DEFAULT_LIMIT, PUBLIC_SHOWS_MAX_LIMIT } from "@/lib/public-agenda";
import { getPublicAgenda } from "@/lib/public-agenda-query";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

/*
 * API PÚBLICA v1 — agenda de shows da banda (liberada em proxy.ts).
 * Contrato usado por sites externos: não remova nem renomeie campos; adicione novos
 * ou crie /v2. Formato documentado em docs/integracoes.md.
 */

/** Dados públicos e só leitura: qualquer origem pode ler. */
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

/** CDN guarda 60s e serve versão antiga por até 5min enquanto revalida. */
const CACHE = "public, s-maxage=60, stale-while-revalidate=300";

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const limited = rateLimit(`public-agenda:${clientIp(request)}`, RATE_LIMITS.publicAgenda);
  if (!limited.ok) {
    return jsonError(429, "Muitas requisições. Tente novamente em instantes.", {
      headers: { ...CORS, "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  const { slug } = await context.params;
  const rawLimit = Number.parseInt(new URL(request.url).searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), PUBLIC_SHOWS_MAX_LIMIT)
    : PUBLIC_SHOWS_DEFAULT_LIMIT;

  const agenda = await getPublicAgenda(slug.toLowerCase(), limit);
  if (!agenda) return jsonError(404, "Agenda não encontrada.", { headers: CORS });

  const baseUrl = await getPublicBaseUrl();
  return NextResponse.json(
    {
      band: { ...agenda.band, url: `${baseUrl}/b/${agenda.band.slug}` },
      shows: agenda.shows,
      generatedAt: new Date().toISOString(),
    },
    { headers: { ...CORS, "Cache-Control": CACHE } },
  );
}
