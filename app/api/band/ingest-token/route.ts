import { NextResponse } from "next/server";
import { withBand } from "@/lib/api";
import { generateLeadIngestToken } from "@/lib/lead-ingest-auth";
import { prisma } from "@/lib/prisma";

/** Gera ou regenera o token de ingestão de leads. Só o hash é persistido. */
export const POST = withBand(async (_request, { bandId }) => {
  const { token, hash } = generateLeadIngestToken();
  await prisma.band.update({
    where: { id: bandId },
    data: { leadIngestTokenHash: hash },
  });
  return NextResponse.json({ token });
});
