import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";
import { showCreateSchema, showUpdateSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

function parseDateOnly(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET(_request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const show = await prisma.show.findFirst({
    where: { id, bandId: ctx.bandId },
    include: { venue: { select: { id: true, name: true, city: true, state: true } } },
  });

  if (!show) {
    return NextResponse.json({ error: "Show não encontrado" }, { status: 404 });
  }

  return NextResponse.json(show);
}

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.show.findFirst({
    where: { id, bandId: ctx.bandId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Show não encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = showUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  let nextVenueId: string | null = existing.venueId;
  if (data.venueId !== undefined) {
    if (data.venueId === null || (typeof data.venueId === "string" && !data.venueId.trim())) {
      nextVenueId = null;
    } else if (typeof data.venueId === "string") {
      nextVenueId = data.venueId.trim();
    }
  }

  const nextPrivateDetails =
    data.privateEventDetails === undefined
      ? existing.privateEventDetails
      : typeof data.privateEventDetails === "string"
        ? data.privateEventDetails.trim() || null
        : data.privateEventDetails;

  const nextPrivateCity =
    data.privateCity === undefined
      ? existing.privateCity
      : typeof data.privateCity === "string"
        ? data.privateCity.trim() || null
        : data.privateCity;

  const nextPrivateState =
    data.privateState === undefined
      ? existing.privateState
      : typeof data.privateState === "string"
        ? data.privateState.trim().toUpperCase() || null
        : data.privateState;

  const nextPrivateValorCache =
    data.privateValorCache === undefined ? existing.privateValorCache : data.privateValorCache;

  const mergedPayment = data.paymentStatus ?? existing.paymentStatus;

  const mergedForValidate = {
    venueId: nextVenueId,
    date: data.date ?? existing.date.toISOString().slice(0, 10),
    time: (data.time ?? existing.time).trim(),
    privateEventDetails: nextVenueId ? null : nextPrivateDetails,
    privateCity: nextVenueId ? null : nextPrivateCity,
    privateState: nextVenueId ? null : nextPrivateState,
    privateValorCache: nextVenueId ? null : nextPrivateValorCache,
    paymentStatus: mergedPayment,
  };

  const finalCheck = showCreateSchema.safeParse(mergedForValidate);
  if (!finalCheck.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: finalCheck.error.flatten() },
      { status: 400 },
    );
  }

  if (nextVenueId) {
    const venue = await prisma.venue.findFirst({
      where: { id: nextVenueId, bandId: ctx.bandId },
      select: { id: true },
    });
    if (!venue) {
      return NextResponse.json({ error: "Casa de show inválida" }, { status: 400 });
    }
  }

  let dateValue: Date | undefined;
  if (data.date !== undefined) {
    const parsedDate = parseDateOnly(data.date);
    if (!parsedDate) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }
    dateValue = parsedDate;
  }

  const privateValorForDb = nextVenueId
    ? null
    : nextPrivateValorCache !== null &&
        nextPrivateValorCache !== undefined &&
        Number.isFinite(nextPrivateValorCache)
      ? nextPrivateValorCache
      : null;

  const show = await prisma.show.update({
    where: { id },
    data: {
      venueId: nextVenueId,
      privateEventDetails: nextVenueId ? null : nextPrivateDetails,
      privateCity: nextVenueId ? null : nextPrivateCity,
      privateState: nextVenueId ? null : nextPrivateState,
      privateValorCache: privateValorForDb,
      ...(dateValue !== undefined && { date: dateValue }),
      ...(data.time !== undefined && { time: data.time.trim() }),
      ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
    },
  });

  return NextResponse.json(show);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.show.findFirst({
    where: { id, bandId: ctx.bandId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Show não encontrado" }, { status: 404 });
  }

  await prisma.show.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
