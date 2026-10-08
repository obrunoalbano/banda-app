import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { venueUpdateSchema } from "@/lib/validations";

type Params = { id: string };

export const PATCH = withBand<Params>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, venueUpdateSchema);
  if (!parsed.ok) return parsed.response;

  // updateMany com bandId: checa posse e atualiza em uma query.
  const { count } = await prisma.venue.updateMany({
    where: { id, bandId },
    data: parsed.data,
  });
  if (count === 0) return jsonError(404, "Casa não encontrada");

  return NextResponse.json({ id });
});

export const DELETE = withBand<Params>(async (_request, { bandId, params: { id } }) => {
  const existing = await prisma.venue.findFirst({
    where: { id, bandId },
    select: { _count: { select: { shows: true } } },
  });
  if (!existing) return jsonError(404, "Casa não encontrada");

  // Preserva o histórico: a FK Show.venueId (NO ACTION) também barraria no banco.
  const showCount = existing._count.shows;
  if (showCount > 0) {
    return jsonError(
      409,
      `Esta casa tem ${showCount} show(s) vinculado(s). Remova ou altere esses shows antes de remover a casa.`,
    );
  }

  await prisma.venue.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
