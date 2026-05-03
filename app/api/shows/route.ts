import { NextResponse } from "next/server";
import { ShowPaymentStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";
import { showCreateSchema } from "@/lib/validations";

function parseDateOnly(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET() {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const shows = await prisma.show.findMany({
    where: { bandId: ctx.bandId },
    include: { venue: { select: { id: true, name: true, city: true, state: true } } },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });

  return NextResponse.json(shows);
}

export async function POST(request: Request) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = showCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    venueId,
    date,
    time,
    privateEventDetails,
    privateCity,
    privateState,
    privateValorCache,
    paymentStatus,
  } = parsed.data;
  const venueIdNorm = venueId?.trim() || null;
  const privateDetailsNorm = privateEventDetails?.trim() || null;
  const privateCityNorm = privateCity?.trim() || null;
  const privateStateNorm = privateState?.trim().toUpperCase() || null;

  let venue: { id: string } | null = null;
  if (venueIdNorm) {
    venue = await prisma.venue.findFirst({
      where: { id: venueIdNorm, bandId: ctx.bandId },
      select: { id: true },
    });
    if (!venue) {
      return NextResponse.json({ error: "Casa de show inválida" }, { status: 400 });
    }
  }

  const dateValue = parseDateOnly(date);
  if (!dateValue) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const show = await prisma.show.create({
    data: {
      bandId: ctx.bandId,
      venueId: venue?.id ?? null,
      privateEventDetails: venue ? null : privateDetailsNorm,
      privateCity: venue ? null : privateCityNorm,
      privateState: venue ? null : privateStateNorm,
      privateValorCache: venue
        ? null
        : privateValorCache !== undefined && privateValorCache !== null && Number.isFinite(privateValorCache)
          ? privateValorCache
          : null,
      date: dateValue,
      time: time.trim(),
      paymentStatus: paymentStatus ?? ShowPaymentStatus.AGUARDANDO_PAGAMENTO,
    },
  });

  return NextResponse.json(show, { status: 201 });
}
