import type { NextResponse } from "next/server";
import type { BandRole } from "@/app/generated/prisma/enums";
import { isUniqueViolation } from "@/lib/api";
import { parseBandLinkToken } from "@/lib/band-link";
import { findAvailableSlug } from "@/lib/band-slug";
import { hashInviteToken } from "@/lib/members";
import { emailLinkBaseUrl } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { ACTIVE_BAND_COOKIE, activeBandCookieOptions } from "@/lib/session";

/**
 * Operações de acesso multi-bandas usadas por mais de uma rota (servidor).
 * Regras puras (papéis, último administrador, convite) ficam em lib/members.ts.
 */

type Owner = { id: string; name: string; email: string; phone: string | null };

/** Cria a banda com o usuário como ADMINISTRADOR. O slug pode colidir com um cadastro simultâneo: tenta de novo. */
export async function createBandWithAdmin(owner: Owner, name: string): Promise<{ id: string } | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.band.create({
        data: {
          name,
          responsible: owner.name,
          phone: owner.phone ?? "",
          slug: await findAvailableSlug(name),
          members: {
            create: { userId: owner.id, name: owner.name, email: owner.email, role: "ADMIN", joinedAt: new Date() },
          },
        },
        select: { id: true },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return null;
}

/** Convite pendente e no prazo pelo token do link (ou `null`). */
export async function findPendingInvite(token: string) {
  if (!token || token.length > 200) return null;
  return prisma.bandMember.findFirst({
    where: { inviteTokenHash: hashInviteToken(token), userId: null, inviteExpiresAt: { gt: new Date() } },
    select: { id: true, bandId: true, email: true, name: true, band: { select: { name: true, disabledAt: true } } },
  });
}

/**
 * Vincula o convite ao usuário (uso único: só se ainda estiver pendente). Se a pessoa já era
 * integrante por outro registro (ex.: convite duplicado), o unique (bandId, userId) recusa → `false`.
 */
export async function claimInvite(memberId: string, userId: string): Promise<boolean> {
  try {
    const { count } = await prisma.bandMember.updateMany({
      where: { id: memberId, userId: null },
      data: { userId, joinedAt: new Date(), inviteTokenHash: null, inviteExpiresAt: null },
    });
    return count === 1;
  } catch (error) {
    if (isUniqueViolation(error)) return false;
    throw error;
  }
}

/** Banda do link de convite do grupo (assinatura conferida, link ativo, banda não desativada). */
export async function findBandByLink(token: string) {
  const nonce = parseBandLinkToken(token);
  if (!nonce) return null;
  return prisma.band.findFirst({
    where: { inviteLinkNonce: nonce, disabledAt: null },
    select: { id: true, name: true, inviteLinkRole: true },
  });
}

export type JoinByLinkResult = "joined" | "already-member" | "conflict";

/**
 * Entra na banda pelo link do grupo. Já integrante → nada muda. Convite individual pendente para
 * o mesmo email → é aceito (vale o acesso daquele convite). Senão cria o integrante com o acesso
 * do link. `conflict`: o email já pertence a outro integrante com conta (raro: troca de email).
 */
export async function joinBandByLink(
  band: { id: string; inviteLinkRole: BandRole },
  user: { id: string; name: string; email: string },
): Promise<JoinByLinkResult> {
  const existing = await prisma.bandMember.findFirst({
    where: { bandId: band.id, OR: [{ userId: user.id }, { email: user.email }] },
    select: { id: true, userId: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing?.userId === user.id) return "already-member";
  if (existing && !existing.userId) return (await claimInvite(existing.id, user.id)) ? "joined" : "already-member";
  if (existing) return "conflict";
  try {
    await prisma.bandMember.create({
      data: {
        bandId: band.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: band.inviteLinkRole,
        joinedAt: new Date(),
      },
    });
    return "joined";
  } catch (error) {
    // Duas abas aceitando ao mesmo tempo: o unique (bandId, userId|email) garante um registro só.
    if (isUniqueViolation(error)) return "already-member";
    throw error;
  }
}

/** Base dos links enviados por email (mesma regra anti-poisoning do "esqueci minha senha"). */
export function appBaseUrl(request: Request): string | null {
  return emailLinkBaseUrl(request.url);
}

export function setActiveBandCookie(response: NextResponse, bandId: string): NextResponse {
  response.cookies.set(ACTIVE_BAND_COOKIE, bandId, activeBandCookieOptions);
  return response;
}
