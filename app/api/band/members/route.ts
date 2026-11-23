import { NextResponse } from "next/server";
import { isUniqueViolation, jsonError, parseBody, withBand } from "@/lib/api";
import { inviteMember } from "@/lib/band-invite";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { bandMemberCreateSchema } from "@/lib/validations";

/** Administrador adiciona integrante: com conta → acesso na hora; sem conta → convite por link. */
export const POST = withBand(async (request, { bandId, userId }) => {
  // Cada convite pode disparar um email: limita para a rota não virar disparador de spam.
  const limited = rateLimit(`band-invite:${bandId}`, RATE_LIMITS.bandInvite);
  if (!limited.ok) {
    return jsonError(429, "Muitos convites em pouco tempo. Tente novamente mais tarde.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }
  const parsed = await parseBody(request, bandMemberCreateSchema);
  if (!parsed.ok) return parsed.response;

  let member: { id: string; email: string };
  try {
    member = await prisma.bandMember.create({ data: { bandId, ...parsed.data }, select: { id: true, email: true } });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError(409, "Este email já é integrante da banda.");
    throw error;
  }
  try {
    const result = await inviteMember(request, member, { bandId, userId });
    return NextResponse.json({ id: member.id, ...result }, { status: 201 });
  } catch (error) {
    // Vínculo com conta existente pode colidir (bandId, userId) se a pessoa já estiver por outro email.
    if (isUniqueViolation(error)) {
      await prisma.bandMember.deleteMany({ where: { id: member.id, bandId } });
      return jsonError(409, "Esta pessoa já é integrante da banda.");
    }
    throw error;
  }
});
