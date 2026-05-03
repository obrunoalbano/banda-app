import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";
import { bandUpdateSchema } from "@/lib/validations";

export async function GET() {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const band = await prisma.band.findUnique({
    where: { id: ctx.bandId },
    select: {
      id: true,
      name: true,
      responsible: true,
      phone: true,
      email: true,
      createdAt: true,
      leadIngestToken: true,
    },
  });

  if (!band) {
    return NextResponse.json({ error: "Banda não encontrada" }, { status: 404 });
  }

  const { leadIngestToken, ...rest } = band;
  return NextResponse.json({
    ...rest,
    hasLeadIngestToken: !!leadIngestToken,
  });
}

export async function PATCH(request: Request) {
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

  const parsed = bandUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const emailNorm = data.email?.trim().toLowerCase();

  if (emailNorm !== undefined) {
    const existing = await prisma.band.findUnique({ where: { email: emailNorm } });
    if (existing && existing.id !== ctx.bandId) {
      return NextResponse.json({ error: "Este email já está em uso" }, { status: 409 });
    }
  }

  const band = await prisma.band.update({
    where: { id: ctx.bandId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.responsible !== undefined && { responsible: data.responsible.trim() }),
      ...(data.phone !== undefined && { phone: data.phone.trim() }),
      ...(emailNorm !== undefined && { email: emailNorm }),
    },
    select: { id: true, name: true, responsible: true, phone: true, email: true },
  });

  return NextResponse.json(band);
}

