import { NextResponse } from "next/server";
import { VenueSendStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";
import { venueCreateSchema } from "@/lib/validations";

export async function GET() {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const venues = await prisma.venue.findMany({
    where: { bandId: ctx.bandId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(venues);
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

  const parsed = venueCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, responsible, phone, email, city, state, valorCache, instagram, sendStatus } =
    parsed.data;

  const instagramNorm =
    instagram === undefined || instagram === null || instagram.trim() === ""
      ? null
      : instagram.trim();

  const emailNorm = (email ?? "").trim().toLowerCase();

  const venue = await prisma.venue.create({
    data: {
      bandId: ctx.bandId,
      name: name.trim(),
      responsible: responsible.trim(),
      phone: phone.trim(),
      email: emailNorm,
      city: city.trim(),
      state: state.trim(),
      valorCache: valorCache ?? null,
      instagram: instagramNorm,
      sendStatus: sendStatus ?? VenueSendStatus.NAO_ENVIADO,
    },
  });

  return NextResponse.json(venue, { status: 201 });
}
