import { NextResponse } from "next/server";
import { parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { bandUpdateSchema } from "@/lib/validations";

/** Dados cadastrais da banda ativa (só administradores). */
export const PATCH = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, bandUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const band = await prisma.band.update({
    where: { id: bandId },
    data: parsed.data,
    select: { id: true, name: true, responsible: true, phone: true },
  });
  return NextResponse.json(band);
});
