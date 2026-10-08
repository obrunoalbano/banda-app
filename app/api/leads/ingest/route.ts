import type { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { jsonError, parseBody } from "@/lib/api";
import { leadIngestCorsHeaders } from "@/lib/lead-cors";
import { extractLeadIngestToken, hashLeadIngestToken } from "@/lib/lead-ingest-auth";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { leadIngestSchema, normalizeLeadIngestBody } from "@/lib/validations";

/*
 * Endpoint PÚBLICO (liberado em proxy.ts). Contrato usado por sites externos — não quebrar:
 * token em `Authorization: Bearer` ou `X-Lead-Token`; aliases legados `phone`/`message`.
 */

export async function OPTIONS(request: Request) {
  const cors = leadIngestCorsHeaders(request);
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: Request) {
  const cors = leadIngestCorsHeaders(request);
  const unauthorized = () => jsonError(401, "Credencial inválida ou ausente.", { headers: cors });

  const token = extractLeadIngestToken(request);
  if (!token) return unauthorized();

  const tokenHash = hashLeadIngestToken(token);
  const limited = rateLimit(`ingest:${tokenHash}`, RATE_LIMITS.leadIngest);
  if (!limited.ok) {
    return jsonError(429, "Muitas requisições. Tente novamente em instantes.", {
      headers: { ...cors, "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  const parsed = await parseBody(request, leadIngestSchema, {
    normalize: normalizeLeadIngestBody,
    headers: cors,
  });
  if (!parsed.ok) return parsed.response;

  const band = await prisma.band.findUnique({
    where: { leadIngestTokenHash: tokenHash },
    select: { id: true },
  });
  if (!band) return unauthorized();

  const { metadata, ...data } = parsed.data;
  const lead = await prisma.lead.create({
    data: {
      ...data,
      bandId: band.id,
      ...(metadata != null && { metadata: metadata as Prisma.InputJsonValue }),
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json(
    { ...lead, createdAt: lead.createdAt.toISOString() },
    { status: 201, headers: cors },
  );
}
