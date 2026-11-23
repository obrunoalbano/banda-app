import { appBaseUrl } from "@/lib/band-access";
import { sendEmail } from "@/lib/email";
import { generateInviteToken, inviteEmail, inviteUrl } from "@/lib/members";
import { prisma } from "@/lib/prisma";

/**
 * Convida um integrante pendente: se o email JÁ tem conta, vincula na hora (a banda aparece para
 * a pessoa no próximo acesso); senão gera um link novo (invalida o anterior) e envia por email.
 * O link também volta na resposta para o administrador poder mandar por WhatsApp.
 */
export async function inviteMember(
  request: Request,
  member: { id: string; email: string },
  ctx: { bandId: string; userId: string },
): Promise<{ status: "linked" } | { status: "invited"; inviteUrl: string | null; emailSent: boolean }> {
  const existing = await prisma.user.findUnique({ where: { email: member.email }, select: { id: true } });
  if (existing) {
    await prisma.bandMember.updateMany({
      where: { id: member.id, bandId: ctx.bandId, userId: null },
      data: { userId: existing.id, joinedAt: new Date(), inviteTokenHash: null, inviteExpiresAt: null },
    });
    return { status: "linked" };
  }

  const { token, hash, expiresAt } = generateInviteToken();
  await prisma.bandMember.updateMany({
    where: { id: member.id, bandId: ctx.bandId, userId: null },
    data: { inviteTokenHash: hash, inviteExpiresAt: expiresAt },
  });
  const baseUrl = appBaseUrl(request);
  if (!baseUrl) {
    console.error("[convite] NEXT_PUBLIC_APP_URL/VERCEL_PROJECT_PRODUCTION_URL ausentes — link de convite não gerado.");
    return { status: "invited", inviteUrl: null, emailSent: false };
  }
  const url = inviteUrl(baseUrl, token);
  const [band, inviter] = await Promise.all([
    prisma.band.findUnique({ where: { id: ctx.bandId }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: ctx.userId }, select: { name: true } }),
  ]);
  const emailSent = await sendEmail({
    to: member.email,
    ...inviteEmail({ bandName: band?.name ?? "", inviterName: inviter?.name ?? "Um integrante", url }),
  });
  return { status: "invited", inviteUrl: url, emailSent };
}
