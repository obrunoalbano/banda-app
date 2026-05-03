import type { Prisma } from "@/app/generated/prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadIngestCorsHeaders } from "@/lib/lead-cors";
import { extractLeadIngestToken } from "@/lib/lead-ingest-auth";
import { leadIngestSchema, normalizeLeadIngestBody } from "@/lib/validations";

export async function OPTIONS(request: Request) {
  const cors = leadIngestCorsHeaders(request);
  if (!cors) {
    return new NextResponse(null, { status: 204 });
  }
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(request: Request) {
  const cors = leadIngestCorsHeaders(request);

  const token = extractLeadIngestToken(request);
  if (!token) {
    return NextResponse.json({ error: "Credencial inválida ou ausente." }, { status: 401, headers: cors });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400, headers: cors });
  }

  const parsed = leadIngestSchema.safeParse(normalizeLeadIngestBody(body));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400, headers: cors },
    );
  }

  const band = await prisma.band.findFirst({
    where: { leadIngestToken: token },
    select: { id: true },
  });

  if (!band) {
    return NextResponse.json({ error: "Credencial inválida ou ausente." }, { status: 401, headers: cors });
  }

  const d = parsed.data;
  const metaPayload: Prisma.InputJsonValue | undefined =
    d.metadata !== undefined && d.metadata !== null
      ? (d.metadata as Prisma.InputJsonValue)
      : undefined;

  const lead = await prisma.lead.create({
    data: {
      bandId: band.id,
      name: d.name.trim(),
      email: d.email.trim().toLowerCase(),
      whatsapp: d.whatsapp?.trim() || null,
      eventDate: d.eventDate?.trim() || null,
      city: d.city?.trim() || null,
      eventType: d.eventType?.trim() || null,
      eventDescription: d.eventDescription?.trim() || null,
      source: d.source?.trim() || null,
      ...(metaPayload !== undefined ? { metadata: metaPayload } : {}),
    },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return NextResponse.json(
    {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      createdAt: lead.createdAt.toISOString(),
    },
    { status: 201, headers: cors },
  );
}
