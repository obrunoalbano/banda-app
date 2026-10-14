import { NextResponse } from "next/server";
import { isUniqueViolation, jsonError, withBand } from "@/lib/api";
import { venueDataFromStage } from "@/lib/explore";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/**
 * "Adicionar às minhas casas": cria a casa no funil da banda a partir de um palco PUBLICADO.
 * Idempotente — se a banda já adicionou o palco, devolve a casa existente.
 */
export const POST = withBand<{ stageId: string }>(async (_request, { bandId, params: { stageId } }) => {
  const existing = await prisma.venue.findUnique({
    where: { bandId_stageId: { bandId, stageId } },
    select: { id: true },
  });
  if (existing) return NextResponse.json({ venueId: existing.id, created: false });

  const limited = rateLimit(`explore-add:${bandId}`, RATE_LIMITS.exploreAdd);
  if (!limited.ok) {
    return jsonError(429, "Muitos palcos adicionados em pouco tempo. Tente mais tarde.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  const stage = await prisma.stage.findFirst({
    where: { id: stageId, status: "PUBLISHED" },
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
      instagram: true,
      whatsapp: true,
      publicPhone: true,
      publicEmail: true,
    },
  });
  if (!stage) return jsonError(404, "Palco não encontrado");

  try {
    const venue = await prisma.venue.create({ data: venueDataFromStage(stage, bandId), select: { id: true } });
    return NextResponse.json({ venueId: venue.id, created: true }, { status: 201 });
  } catch (error) {
    // Clique duplo/abas paralelas: a outra requisição criou primeiro.
    if (isUniqueViolation(error)) {
      const venue = await prisma.venue.findUnique({
        where: { bandId_stageId: { bandId, stageId } },
        select: { id: true },
      });
      if (venue) return NextResponse.json({ venueId: venue.id, created: false });
    }
    throw error;
  }
});
