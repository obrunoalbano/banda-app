import type { NextResponse } from "next/server";
import { isUniqueViolation } from "@/lib/api";
import { findAvailableSlug } from "@/lib/band-slug";
import { hashInviteToken } from "@/lib/members";
import { passwordResetBaseUrl } from "@/lib/password-reset";
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

/** Base dos links enviados por email (mesma regra anti-poisoning do "esqueci minha senha"). */
export function appBaseUrl(request: Request): string | null {
  return passwordResetBaseUrl({
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    requestUrl: request.url,
    isProduction: process.env.NODE_ENV === "production",
  });
}

export function setActiveBandCookie(response: NextResponse, bandId: string): NextResponse {
  response.cookies.set(ACTIVE_BAND_COOKIE, bandId, activeBandCookieOptions);
  return response;
}
