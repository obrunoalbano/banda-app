import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";

const LIST_TAKE = 100;

export async function GET() {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const leads = await prisma.lead.findMany({
    where: { bandId: ctx.bandId },
    orderBy: { createdAt: "desc" },
    take: LIST_TAKE,
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      eventDate: true,
      city: true,
      eventType: true,
      eventDescription: true,
      source: true,
      metadata: true,
      createdAt: true,
    },
  });

  return NextResponse.json(leads);
}
