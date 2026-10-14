import { NextResponse } from "next/server";
import { isUniqueViolation, jsonError, parseBody, withBand } from "@/lib/api";
import { dealFromLead, dealFromStage } from "@/lib/deals";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { dealCreateSchema } from "@/lib/validations";

/**
 * Inclui um contato (da banda) ou um palco PUBLICADO no Fluxo de contatos, na etapa
 * "Primeiro contato". Idempotente: se já estiver no fluxo, devolve a negociação existente.
 */
export const POST = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, dealCreateSchema);
  if (!parsed.ok) return parsed.response;
  const origin = parsed.data;
  const unique =
    "leadId" in origin
      ? { bandId_leadId: { bandId, leadId: origin.leadId } }
      : { bandId_stageId: { bandId, stageId: origin.stageId } };

  const existing = await prisma.deal.findUnique({ where: unique, select: { id: true, step: true } });
  if (existing) return NextResponse.json({ ...existing, created: false });

  const limited = rateLimit(`deal-add:${bandId}`, RATE_LIMITS.dealAdd);
  if (!limited.ok) {
    return jsonError(429, "Muitas inclusões no fluxo em pouco tempo. Tente mais tarde.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  let data;
  if ("leadId" in origin) {
    const lead = await prisma.lead.findFirst({
      where: { id: origin.leadId, bandId },
      select: { id: true, name: true, city: true },
    });
    if (!lead) return jsonError(404, "Contato não encontrado");
    data = dealFromLead(lead, bandId);
  } else {
    const stage = await prisma.stage.findFirst({
      where: { id: origin.stageId, status: "PUBLISHED" },
      select: { id: true, name: true, city: true, state: true },
    });
    if (!stage) return jsonError(404, "Palco não encontrado");
    data = dealFromStage(stage, bandId);
  }

  try {
    const deal = await prisma.deal.create({ data, select: { id: true, step: true } });
    return NextResponse.json({ ...deal, created: true }, { status: 201 });
  } catch (error) {
    // Clique duplo/abas paralelas: a outra requisição criou primeiro.
    if (isUniqueViolation(error)) {
      const deal = await prisma.deal.findUnique({ where: unique, select: { id: true, step: true } });
      if (deal) return NextResponse.json({ ...deal, created: false });
    }
    throw error;
  }
});
