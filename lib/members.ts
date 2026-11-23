import { createHash, randomBytes } from "node:crypto";
import type { BandRole } from "@/app/generated/prisma/enums";
import { PRODUCT_NAME } from "@/components/ui/Brand";

/**
 * Integrantes da banda (BandMember): convites e regras de gestão (servidor). Labels dos papéis: lib/band-roles.ts.
 * Ver docs/admin.md §7 (acesso multi-bandas).
 */

/* ── Convite (integrante ainda sem conta) ────────────────────────────── */

export const INVITE_TTL_DAYS = 14;
export const INVITE_PAGE = "/convite";

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Token de 256 bits; o banco guarda só o hash (como o "esqueci minha senha"). */
export function generateInviteToken(now: number = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return {
    token,
    hash: hashInviteToken(token),
    expiresAt: new Date(now + INVITE_TTL_DAYS * 24 * 60 * 60_000),
  };
}

export function inviteUrl(baseUrl: string, token: string): string {
  return `${baseUrl}${INVITE_PAGE}/${encodeURIComponent(token)}`;
}

export type MemberStatus = "active" | "pending" | "expired";

export function memberStatus(
  member: { userId: string | null; inviteExpiresAt: Date | null },
  now: Date = new Date(),
): MemberStatus {
  if (member.userId) return "active";
  return member.inviteExpiresAt && member.inviteExpiresAt > now ? "pending" : "expired";
}

/* ── Regras de gestão ────────────────────────────────────────────────── */

type MemberRef = { id: string; role: BandRole; userId: string | null };

/**
 * A banda precisa de pelo menos um administrador COM conta. Rebaixar ou remover o último
 * deixaria a banda sem ninguém para gerenciá-la. Devolve a mensagem de bloqueio ou `null`.
 */
export function lastAdminBlock(
  members: MemberRef[],
  target: MemberRef,
  change: { type: "remove" } | { type: "role"; role: BandRole },
): string | null {
  if (target.role !== "ADMIN" || !target.userId) return null;
  if (change.type === "role" && change.role === "ADMIN") return null;
  const otherActiveAdmins = members.filter((m) => m.id !== target.id && m.role === "ADMIN" && m.userId).length;
  if (otherActiveAdmins > 0) return null;
  return change.type === "remove"
    ? "A banda precisa de pelo menos um administrador. Promova outro integrante antes de remover este."
    : "A banda precisa de pelo menos um administrador. Promova outro integrante antes de mudar este papel.";
}

/** Banda ativa da sessão: a do cookie (se ainda for membro) ou a primeira. */
export function pickActiveMembership<M extends { bandId: string }>(memberships: M[], preferredBandId?: string | null) {
  return memberships.find((m) => m.bandId === preferredBandId) ?? memberships[0] ?? null;
}

export function inviteEmail({ bandName, inviterName, url }: { bandName: string; inviterName: string; url: string }) {
  const subject = `${inviterName} convidou você para a banda ${bandName}`;
  const text = [
    "Olá!",
    "",
    `${inviterName} convidou você para acessar a banda ${bandName} no ${PRODUCT_NAME}.`,
    `Para aceitar, crie sua conta pelo link abaixo (vale por ${INVITE_TTL_DAYS} dias):`,
    "",
    url,
  ].join("\n");
  const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const html = `<p>Olá!</p>
<p>${esc(inviterName)} convidou você para acessar a banda <strong>${esc(bandName)}</strong> no ${PRODUCT_NAME}.</p>
<p><a href="${esc(url)}">Aceitar convite</a></p>
<p>O link vale por ${INVITE_TTL_DAYS} dias.</p>`;
  return { subject, text, html };
}
