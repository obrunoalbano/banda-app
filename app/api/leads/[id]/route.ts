import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";
import { leadUpdateSchema, normalizeLeadIngestBody } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const lead = await prisma.lead.findFirst({
    where: { id, bandId: ctx.bandId },
  });

  if (!lead) {
    return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PATCH(request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.lead.findFirst({
    where: { id, bandId: ctx.bandId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = leadUpdateSchema.safeParse(normalizeLeadIngestBody(body));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const metadataValue: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue | undefined =
    data.metadata === undefined
      ? undefined
      : data.metadata === null
        ? Prisma.JsonNull
        : (data.metadata as Prisma.InputJsonValue);

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
      ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp?.trim() || null }),
      ...(data.eventDate !== undefined && { eventDate: data.eventDate?.trim() || null }),
      ...(data.city !== undefined && { city: data.city?.trim() || null }),
      ...(data.eventType !== undefined && { eventType: data.eventType?.trim() || null }),
      ...(data.eventDescription !== undefined && {
        eventDescription: data.eventDescription?.trim() || null,
      }),
      ...(data.source !== undefined && { source: data.source?.trim() || null }),
      ...(metadataValue !== undefined && { metadata: metadataValue }),
    },
  });

  return NextResponse.json(lead);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.lead.findFirst({
    where: { id, bandId: ctx.bandId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
