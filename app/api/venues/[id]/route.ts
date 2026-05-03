import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";
import { venueUpdateSchema } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const venue = await prisma.venue.findFirst({
    where: { id, bandId: ctx.bandId },
  });

  if (!venue) {
    return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
  }

  return NextResponse.json(venue);
}

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.venue.findFirst({
    where: { id, bandId: ctx.bandId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = venueUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const instagramNorm =
    data.instagram === undefined
      ? undefined
      : data.instagram === null || data.instagram.trim() === ""
        ? null
        : data.instagram.trim();

  const venue = await prisma.venue.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.responsible !== undefined && { responsible: data.responsible.trim() }),
      ...(data.phone !== undefined && { phone: data.phone.trim() }),
      ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
      ...(data.city !== undefined && { city: data.city.trim() }),
      ...(data.state !== undefined && { state: data.state.trim() }),
      ...(data.valorCache !== undefined && {
        valorCache: data.valorCache === null ? null : data.valorCache,
      }),
      ...(data.instagram !== undefined && { instagram: instagramNorm }),
      ...(data.sendStatus !== undefined && { sendStatus: data.sendStatus }),
    },
  });

  return NextResponse.json(venue);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.venue.findFirst({
    where: { id, bandId: ctx.bandId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Casa não encontrada" }, { status: 404 });
  }

  await prisma.venue.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
