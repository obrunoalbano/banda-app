import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand, zodError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  parseDateOnly,
  parseOptionalDateOnly,
  resolveCancelledAt,
  resolveShowCache,
  resolveShowLocation,
  resolveShowPaidAt,
  resolveShowVisibility,
  toDateOnlyString,
  todayDateOnly,
} from "@/lib/shows";
import { showCreateSchema, showUpdateSchema } from "@/lib/validations";

type Params = { id: string };

export const PATCH = withBand<Params>(async (request, { bandId, params: { id } }) => {
  const existing = await prisma.show.findFirst({ where: { id, bandId } });
  if (!existing) return jsonError(404, "Show não encontrado");

  const parsed = await parseBody(request, showUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const {
    date,
    time,
    cacheCents,
    paymentStatus,
    paymentDueDate,
    paidAt,
    isPublic,
    ticketUrl,
    cancelled,
    repertoireId,
    eventName,
    ...locationInput
  } = parsed.data;

  const location = resolveShowLocation(locationInput, existing);

  // Revalida o estado final (PATCH parcial pode deixar evento particular sem cidade/UF).
  const finalCheck = showCreateSchema.safeParse({
    ...location,
    date: date ?? toDateOnlyString(existing.date),
    time: time ?? existing.time,
  });
  if (!finalCheck.success) return zodError(finalCheck.error);

  let venueCacheCents: number | null | undefined;
  if (location.venueId) {
    const venue = await prisma.venue.findFirst({
      where: { id: location.venueId, bandId },
      select: { valorCacheCents: true },
    });
    if (!venue) return jsonError(400, "Casa de show inválida");
    venueCacheCents = venue.valorCacheCents;
  }

  if (
    repertoireId &&
    !(await prisma.repertoire.findFirst({ where: { id: repertoireId, bandId }, select: { id: true } }))
  ) {
    return jsonError(400, "Repertório inválido");
  }
  // Trocou o repertório: a ordem própria era do repertório antigo.
  const repertoireChanged = repertoireId !== undefined && repertoireId !== existing.repertoireId;

  let dateValue: Date | undefined;
  if (date !== undefined) {
    const parsedDate = parseDateOnly(date);
    if (!parsedDate) return jsonError(400, "Data inválida");
    dateValue = parsedDate;
  }
  const dueDate = parseOptionalDateOnly(paymentDueDate);
  if (!dueDate.ok) return jsonError(400, "Vencimento inválido");
  const paidDate = parseOptionalDateOnly(paidAt);
  if (!paidDate.ok) return jsonError(400, "Data de pagamento inválida");

  const show = await prisma.show.update({
    where: { id },
    data: {
      ...location,
      cacheCents: resolveShowCache({
        inputCents: cacheCents,
        currentCents: existing.cacheCents,
        venueChanged: location.venueId !== existing.venueId,
        venueCacheCents,
      }),
      ...(dateValue && { date: dateValue }),
      ...(time !== undefined && { time }),
      ...(paymentStatus && { paymentStatus }),
      ...(dueDate.value !== undefined && { paymentDueDate: dueDate.value }),
      paidAt: resolveShowPaidAt({
        inputStatus: paymentStatus,
        inputPaidAt: paidDate.value,
        currentStatus: existing.paymentStatus,
        currentPaidAt: existing.paidAt,
        today: todayDateOnly(),
      }),
      isPublic: resolveShowVisibility({
        inputIsPublic: isPublic,
        currentIsPublic: existing.isPublic,
        venueId: location.venueId,
      }),
      ...(ticketUrl !== undefined && { ticketUrl }),
      ...(eventName !== undefined && { eventName }),
      cancelledAt: resolveCancelledAt(cancelled, existing.cancelledAt),
      ...(repertoireChanged && { repertoireId, songOrder: [] }),
    },
  });

  return NextResponse.json(show);
});

export const DELETE = withBand<Params>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.show.deleteMany({ where: { id, bandId } });
  if (count === 0) return jsonError(404, "Show não encontrado");
  return NextResponse.json({ ok: true });
});
