import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { canAddToVenues } from "@/lib/deals";
import { prisma } from "@/lib/prisma";
import { venueCreateSchema } from "@/lib/validations";

/** Desfaz a transação quando outra requisição já ligou a negociação a uma casa. */
class AlreadyLinked extends Error {}

export const POST = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, venueCreateSchema);
  if (!parsed.ok) return parsed.response;

  const { email, dealId, ...data } = parsed.data;

  if (!dealId) {
    const venue = await prisma.venue.create({ data: { ...data, email: email ?? "", bandId } });
    return NextResponse.json(venue, { status: 201 });
  }

  // "Adicionar às minhas casas" a partir do Fluxo de contatos: só negociação GANHA e ainda sem casa.
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, bandId },
    select: { id: true, step: true, venueId: true, stageId: true },
  });
  if (!deal) return jsonError(404, "Negociação não encontrada");
  if (!canAddToVenues(deal)) {
    return jsonError(409, deal.venueId ? "Esta negociação já virou casa." : "Só negociações ganhas viram casa.");
  }

  // Palco já ligado a uma casa da banda (ex.: adicionada antes do fluxo existir) → só vincula.
  const linked = deal.stageId
    ? await prisma.venue.findUnique({ where: { bandId_stageId: { bandId, stageId: deal.stageId } } })
    : null;

  const venue = await prisma.$transaction(async (tx) => {
    const v =
      linked ??
      (await tx.venue.create({ data: { ...data, email: email ?? "", bandId, stageId: deal.stageId } }));
    // `venueId: null` no where: envio duplo não cria duas casas (o segundo desfaz a transação).
    const { count } = await tx.deal.updateMany({
      where: { id: deal.id, bandId, venueId: null },
      data: { venueId: v.id },
    });
    if (count !== 1) throw new AlreadyLinked();
    return v;
  }).catch((error: unknown) => {
    if (error instanceof AlreadyLinked) return null;
    throw error;
  });
  if (!venue) return jsonError(409, "Esta negociação já virou casa.");
  return NextResponse.json(venue, { status: linked ? 200 : 201 });
});
