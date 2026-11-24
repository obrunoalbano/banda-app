import { NextResponse } from "next/server";
import { jsonError, withUser } from "@/lib/api";
import { findBandByLink, joinBandByLink, setActiveBandCookie } from "@/lib/band-access";
import { prisma } from "@/lib/prisma";

/** Usuário logado entra na banda pelo link de convite do grupo (idempotente: já integrante = ok). */
export const POST = withUser<{ token: string }>(async (_request, { userId, params: { token } }) => {
  const band = await findBandByLink(token);
  if (!band) return jsonError(404, "Link de convite inválido ou desativado. Peça um novo link à banda.");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true } });
  if (!user) return jsonError(401, "Sessão expirada. Entre novamente.");
  const result = await joinBandByLink(band, user);
  if (result === "conflict") {
    return jsonError(409, "Já existe um integrante com o seu email nesta banda. Fale com um administrador.");
  }
  return setActiveBandCookie(NextResponse.json({ bandId: band.id, result }), band.id);
});
