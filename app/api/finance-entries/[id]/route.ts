import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { isCategoryAllowed } from "@/lib/finance-categories";
import { prisma } from "@/lib/prisma";
import { parseOptionalDateOnly } from "@/lib/shows";
import { financeEntryUpdateSchema } from "@/lib/validations";

type Params = { id: string };

export const PATCH = withBand<Params>(async (request, { bandId, params: { id } }) => {
  const existing = await prisma.financeEntry.findFirst({
    where: { id, bandId },
    select: { type: true, category: true },
  });
  if (!existing) return jsonError(404, "Lançamento não encontrado");

  const parsed = await parseBody(request, financeEntryUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { date, paidAt, showId, ...data } = parsed.data;

  // PATCH parcial: confere tipo × categoria no estado final.
  if (!isCategoryAllowed(data.type ?? existing.type, data.category ?? existing.category)) {
    return jsonError(400, "Categoria não combina com o tipo do lançamento");
  }

  const dateValue = parseOptionalDateOnly(date);
  if (!dateValue.ok) return jsonError(400, "Data inválida");
  const paidDate = parseOptionalDateOnly(paidAt);
  if (!paidDate.ok) return jsonError(400, "Data de pagamento inválida");

  if (showId) {
    const show = await prisma.show.findFirst({ where: { id: showId, bandId }, select: { id: true } });
    if (!show) return jsonError(400, "Show inválido");
  }

  const { count } = await prisma.financeEntry.updateMany({
    where: { id, bandId },
    data: {
      ...data,
      ...(dateValue.value && { date: dateValue.value }),
      ...(paidDate.value !== undefined && { paidAt: paidDate.value }),
      ...(showId !== undefined && { showId }),
    },
  });
  if (count === 0) return jsonError(404, "Lançamento não encontrado");
  return NextResponse.json({ id });
});

export const DELETE = withBand<Params>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.financeEntry.deleteMany({ where: { id, bandId } });
  if (count === 0) return jsonError(404, "Lançamento não encontrado");
  return NextResponse.json({ ok: true });
});
