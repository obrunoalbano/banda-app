import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { claimInvite, findPendingInvite, setActiveBandCookie } from "@/lib/band-access";
import { prisma } from "@/lib/prisma";

/** Usuário logado aceita um convite enviado para o SEU email. */
export const POST = withUser<{ token: string }>(async (_request, { userId, params: { token } }) => {
  const invite = await findPendingInvite(token);
  if (!invite || invite.band.disabledAt) return jsonError(404, "Convite inválido ou expirado. Peça um novo link à banda.");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (user?.email !== invite.email) {
    return jsonError(403, `Este convite foi enviado para ${invite.email}. Entre com essa conta para aceitar.`);
  }
  if (!(await claimInvite(invite.id, userId))) {
    return jsonError(409, "Você já faz parte desta banda.");
  }
  return setActiveBandCookie(NextResponse.json({ bandId: invite.bandId }), invite.bandId);
});
