import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseDateOnly, parseOptionalDateOnly } from "@/lib/shows";
import { financeEntryCreateSchema } from "@/lib/validations";

/** Novo lançamento (receita ou despesa), avulso ou de um show da banda. */
export const POST = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, financeEntryCreateSchema);
  if (!parsed.ok) return parsed.response;
  const { date, paidAt, showId, ...data } = parsed.data;

  const dateValue = parseDateOnly(date);
  if (!dateValue) return jsonError(400, "Data inválida");
  const paidDate = parseOptionalDateOnly(paidAt);
  if (!paidDate.ok) return jsonError(400, "Data de pagamento inválida");

  if (showId) {
    const show = await prisma.show.findFirst({ where: { id: showId, bandId }, select: { id: true } });
    if (!show) return jsonError(400, "Show inválido");
  }

  const entry = await prisma.financeEntry.create({
    data: { ...data, bandId, date: dateValue, paidAt: paidDate.value ?? null, showId: showId ?? null },
    select: { id: true },
  });
  return NextResponse.json(entry, { status: 201 });
});
