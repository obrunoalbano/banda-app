import { NextResponse } from "next/server";
import { jsonError, parseBody, withUser } from "@/lib/api";
import { setActiveBandCookie } from "@/lib/band-access";
import { prisma } from "@/lib/prisma";
import { activeBandSchema } from "@/lib/validations";

/** Troca a banda ativa (só para uma banda em que o usuário é integrante). */
export const POST = withUser(async (request, { userId }) => {
  const parsed = await parseBody(request, activeBandSchema);
  if (!parsed.ok) return parsed.response;
  const { bandId } = parsed.data;
  const member = await prisma.bandMember.findFirst({
    where: { bandId, userId, band: { disabledAt: null } },
    select: { id: true },
  });
  if (!member) return jsonError(404, "Banda não encontrada");
  return setActiveBandCookie(NextResponse.json({ bandId }), bandId);
});
