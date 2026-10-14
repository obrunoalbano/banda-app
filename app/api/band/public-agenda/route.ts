import { NextResponse } from "next/server";
import { isUniqueViolation, jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { publicAgendaSchema } from "@/lib/validations";

/** Liga/desliga a agenda pública e altera o slug (endereço público). */
export const PATCH = withBand(async (request, { bandId }) => {
  const parsed = await parseBody(request, publicAgendaSchema);
  if (!parsed.ok) return parsed.response;
  const { enabled, slug } = parsed.data;

  try {
    const band = await prisma.band.update({
      where: { id: bandId },
      data: {
        ...(enabled !== undefined && { publicAgendaEnabled: enabled }),
        ...(slug !== undefined && { slug }),
      },
      select: { slug: true, publicAgendaEnabled: true },
    });
    return NextResponse.json(band);
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError(409, "Este endereço já está em uso por outra banda.");
    throw error;
  }
});
