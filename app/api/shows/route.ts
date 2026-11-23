import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  parseDateOnly,
  parseOptionalDateOnly,
  resolveCancelledAt,
  resolveShowCache,
  resolveShowLocation,
  resolveShowPaidAt,
  resolveShowVisibility,
  todayDateOnly,
} from "@/lib/shows";
import { showCreateSchema } from "@/lib/validations";

export const POST = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, showCreateSchema);
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
    ...locationInput
  } = parsed.data;

  const location = resolveShowLocation(locationInput);

  let venueCacheCents: number | null | undefined;
  if (location.venueId) {
    const venue = await prisma.venue.findFirst({
      where: { id: location.venueId, bandId },
      select: { valorCacheCents: true },
    });
    if (!venue) return jsonError(400, "Casa de show inválida");
    venueCacheCents = venue.valorCacheCents;
  }

  const dateValue = parseDateOnly(date);
  if (!dateValue) return jsonError(400, "Data inválida");
  const dueDate = parseOptionalDateOnly(paymentDueDate);
  if (!dueDate.ok) return jsonError(400, "Vencimento inválido");
  const paidDate = parseOptionalDateOnly(paidAt);
  if (!paidDate.ok) return jsonError(400, "Data de pagamento inválida");

  const show = await prisma.show.create({
    data: {
      ...location,
      bandId,
      date: dateValue,
      time,
      // Snapshot: se não informado, congela o cachê atual da casa.
      cacheCents: resolveShowCache({
        inputCents: cacheCents,
        currentCents: null,
        venueChanged: true,
        venueCacheCents,
      }),
      ...(paymentStatus && { paymentStatus }),
      paymentDueDate: dueDate.value ?? null,
      paidAt: resolveShowPaidAt({ inputStatus: paymentStatus, inputPaidAt: paidDate.value, today: todayDateOnly() }),
      isPublic: resolveShowVisibility({ inputIsPublic: isPublic, venueId: location.venueId }),
      ticketUrl: ticketUrl ?? null,
      cancelledAt: resolveCancelledAt(cancelled, null),
    },
  });

  return NextResponse.json(show, { status: 201 });
});
