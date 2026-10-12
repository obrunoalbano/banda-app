import { NextResponse } from "next/server";
import { jsonError, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { classifyOrigin, defaultLeadSource, spamVerdict } from "@/lib/public-lead";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { publicLeadSchema } from "@/lib/validations";

/*
 * API PÚBLICA v1 — envio do formulário de contato (liberada em proxy.ts).
 * Aceita só: formulários do próprio app (página /b/<slug>/contato e widget) ou origens
 * cadastradas pela banda em Integrações → Contatos (CORS). Integração servidor-a-servidor
 * continua em /api/leads/ingest (token secreto). Contrato em docs/integracoes.md.
 */

type Context = { params: Promise<{ slug: string }> };

async function loadBand(slug: string) {
  return prisma.band.findUnique({
    where: { slug: slug.toLowerCase() },
    select: { id: true, slug: true, leadFormEnabled: true, leadAllowedOrigins: true },
  });
}

async function appOrigins(request: Request): Promise<string[]> {
  return [new URL(request.url).origin, new URL(await getPublicBaseUrl()).origin];
}

function corsFor(origin: string | null, allowed: boolean): HeadersInit | undefined {
  if (!origin || !allowed) return undefined;
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export async function OPTIONS(request: Request, context: Context) {
  const band = await loadBand((await context.params).slug);
  const origin = request.headers.get("origin");
  const kind = band?.leadFormEnabled
    ? classifyOrigin(origin, await appOrigins(request), band.leadAllowedOrigins)
    : "denied";
  return new NextResponse(null, { status: 204, headers: corsFor(origin, kind === "allowed") });
}

export async function POST(request: Request, context: Context) {
  const band = await loadBand((await context.params).slug);
  if (!band?.leadFormEnabled) return jsonError(404, "Formulário não encontrado.");

  const origin = request.headers.get("origin");
  const originKind = classifyOrigin(origin, await appOrigins(request), band.leadAllowedOrigins);
  if (originKind === "denied") {
    return jsonError(403, "Este site não está autorizado a enviar o formulário. Cadastre o domínio em Integrações → Contatos.");
  }
  const cors = corsFor(origin, originKind === "allowed");

  for (const [key, limit] of [
    [`public-lead:${band.id}:${clientIp(request)}`, RATE_LIMITS.publicLeadIp],
    [`public-lead-band:${band.id}`, RATE_LIMITS.publicLeadBand],
  ] as const) {
    const limited = rateLimit(key, limit);
    if (!limited.ok) {
      return jsonError(429, "Muitos envios em pouco tempo. Tente novamente mais tarde.", {
        headers: { ...cors, "Retry-After": String(limited.retryAfterSeconds) },
      });
    }
  }

  const parsed = await parseBody(request, publicLeadSchema, { headers: cors });
  if (!parsed.ok) return parsed.response;
  const { website, formToken, ...data } = parsed.data;

  const verdict = spamVerdict({ honeypot: website, formToken, originKind, slug: band.slug });
  if (verdict === "expired") {
    return jsonError(400, "O formulário expirou. Recarregue a página e envie de novo.", { headers: cors });
  }
  // "drop": responde como sucesso para não ensinar o robô a contornar.
  if (verdict === "accept") {
    await prisma.lead.create({
      data: { ...data, source: data.source ?? defaultLeadSource(originKind, origin!), bandId: band.id },
    });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: cors });
}
