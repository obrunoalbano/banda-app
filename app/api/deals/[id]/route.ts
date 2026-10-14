import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { dealUpdateSchema } from "@/lib/validations";

type Params = { id: string };

/** Move a negociação de etapa e/ou salva as observações. */
export const PATCH = withBand<Params>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, dealUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { step, notes } = parsed.data;

  const { count } = await prisma.deal.updateMany({
    where: { id, bandId },
    data: {
      ...(step !== undefined && { step, stepChangedAt: new Date() }),
      ...(notes !== undefined && { notes }),
    },
  });
  if (count === 0) return jsonError(404, "Negociação não encontrada");
  return NextResponse.json({ id, ...parsed.data });
});

/** Tira do fluxo (o contato, o palco e a casa criada continuam onde estão). */
export const DELETE = withBand<Params>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.deal.deleteMany({ where: { id, bandId } });
  if (count === 0) return jsonError(404, "Negociação não encontrada");
  return NextResponse.json({ ok: true });
});
