import { NextResponse } from "next/server";
import { isUniqueViolation, jsonError, withBand } from "@/lib/api";
import { inviteMember } from "@/lib/band-invite";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/** Gera um novo link de convite (o anterior deixa de valer) e reenvia o email. */
export const POST = withBand<{ id: string }>(async (request, { bandId, userId, params: { id } }) => {
  const limited = rateLimit(`band-invite:${bandId}`, RATE_LIMITS.bandInvite);
  if (!limited.ok) {
    return jsonError(429, "Muitos convites em pouco tempo. Tente novamente mais tarde.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }
  const member = await prisma.bandMember.findFirst({
    where: { id, bandId, userId: null },
    select: { id: true, email: true },
  });
  if (!member) return jsonError(404, "Convite não encontrado (o integrante já pode ter aceitado).");
  try {
    return NextResponse.json(await inviteMember(request, member, { bandId, userId }));
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError(409, "Esta pessoa já é integrante da banda.");
    throw error;
  }
});
