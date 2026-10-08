import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand, zodError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  parseDateOnly,
  resolveShowCache,
  resolveShowLocation,
  toDateOnlyString,
} from "@/lib/shows";
import { showCreateSchema, showUpdateSchema } from "@/lib/validations";

type Params = { id: string };

export const PATCH = withBand<Params>(async (request, { bandId, params: { id } }) => {
  const existing = await prisma.show.findFirst({ where: { id, bandId } });
  if (!existing) return jsonError(404, "Show não encontrado");

  const parsed = await parseBody(request, showUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { date, time, cacheCents, paymentStatus, ...locationInput } = parsed.data;

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

  let dateValue: Date | undefined;
  if (date !== undefined) {
    const parsedDate = parseDateOnly(date);
    if (!parsedDate) return jsonError(400, "Data inválida");
    dateValue = parsedDate;
  }

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
    },
  });

  return NextResponse.json(show);
});

export const DELETE = withBand<Params>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.show.deleteMany({ where: { id, bandId } });
  if (count === 0) return jsonError(404, "Show não encontrado");
  return NextResponse.json({ ok: true });
});
