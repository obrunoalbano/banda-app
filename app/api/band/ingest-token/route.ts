import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireBandSession } from "@/lib/session";

/** Gera ou regenera o token de ingestão de leads (único por banda). */
export async function POST() {
  const ctx = await requireBandSession();
  if (!ctx) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const token = randomBytes(32).toString("hex");
  await prisma.band.update({
    where: { id: ctx.bandId },
    data: { leadIngestToken: token },
  });

  return NextResponse.json({ token });
}
