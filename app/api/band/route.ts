import { NextResponse } from "next/server";
import { unstable_update } from "@/auth";
import { isUniqueViolation, jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { bandUpdateSchema } from "@/lib/validations";

export const PATCH = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, bandUpdateSchema);
  if (!parsed.ok) return parsed.response;

  try {
    const band = await prisma.band.update({
      where: { id: bandId },
      data: parsed.data,
      select: { id: true, name: true, responsible: true, phone: true, email: true },
    });
    // Mantém nome/email do JWT em sincronia (menu lateral, etc.).
    await unstable_update({ user: { name: band.name, email: band.email } });
    return NextResponse.json(band);
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError(409, "Este email já está em uso");
    throw error;
  }
});
