import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import type { BandRole } from "@/app/generated/prisma/enums";
import { pickActiveMembership } from "@/lib/members";
import { prisma } from "@/lib/prisma";

/** `auth()` deduplicado por request (layout + page não decodificam o JWT duas vezes). */
export const getSession = cache(auth);

/** Cookie com a banda escolhida (só uma preferência: a posse é conferida no banco a cada request). */
export const ACTIVE_BAND_COOKIE = "banda_atual";

export const activeBandCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 365 * 24 * 60 * 60,
};

/**
 * Conta ainda ativa? Checado no banco a cada request (deduplicado), para que desativar uma
 * conta no painel corte o acesso na hora — o JWT sozinho continuaria válido por até 30 dias.
 */
const isUserActive = cache(async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { disabledAt: true } });
  return !!user && !user.disabledAt;
});

const isAdminActive = cache(async (id: string) => {
  const admin = await prisma.adminUser.findUnique({ where: { id }, select: { disabledAt: true } });
  return !!admin && !admin.disabledAt;
});

/** Usuário do app logado e ativo (independe de banda). `null` caso contrário. */
export async function requireUserSession() {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id || session.user.role !== "user") return null;
  if (!(await isUserActive(id))) return null;
  return { userId: id, session };
}

/** Para Server Components que só precisam da conta (ex.: /bandas, /conta). */
export async function requireUserId(): Promise<string> {
  const ctx = await requireUserSession();
  if (!ctx) redirect("/login?code=disabled_or_expired");
  return ctx.userId;
}

export type BandMembershipSummary = { bandId: string; bandName: string; role: BandRole };

/** Bandas a que o usuário tem acesso (convite aceito e banda não desativada). */
export const getMemberships = cache(async (userId: string): Promise<BandMembershipSummary[]> => {
  const rows = await prisma.bandMember.findMany({
    where: { userId, band: { disabledAt: null } },
    orderBy: [{ joinedAt: "asc" }, { createdAt: "asc" }],
    select: { bandId: true, role: true, band: { select: { name: true } } },
  });
  return rows.map((r) => ({ bandId: r.bandId, bandName: r.band.name, role: r.role }));
});

export type BandContext = {
  userId: string;
  bandId: string;
  bandName: string;
  role: BandRole;
  /** Administrador da banda: pode criar/alterar/excluir. Visualizador só lê. */
  canEdit: boolean;
  session: Session;
};

/**
 * Banda ativa da sessão: a do cookie, se o usuário ainda for integrante; senão a primeira.
 * `{ reason }` quando não há sessão válida ou o usuário não tem nenhuma banda.
 */
export const getBandContext = cache(async (): Promise<BandContext | { reason: "no-session" | "no-band" }> => {
  const user = await requireUserSession();
  if (!user) return { reason: "no-session" };
  const preferred = (await cookies()).get(ACTIVE_BAND_COOKIE)?.value;
  const active = pickActiveMembership(await getMemberships(user.userId), preferred);
  if (!active) return { reason: "no-band" };
  return {
    userId: user.userId,
    bandId: active.bandId,
    bandName: active.bandName,
    role: active.role,
    canEdit: active.role === "ADMIN",
    session: user.session,
  };
});

/** Para route handlers da banda: `null` quando não autenticado, sem banda ou conta desativada. */
export async function requireBandSession(): Promise<BandContext | null> {
  const ctx = await getBandContext();
  return "reason" in ctx ? null : ctx;
}

/** Para Server Components do app da banda: redireciona para /login (sem sessão) ou /bandas (sem banda). */
export async function requireBandContext(): Promise<BandContext> {
  const ctx = await getBandContext();
  if ("reason" in ctx) redirect(ctx.reason === "no-band" ? "/bandas" : "/login?code=disabled_or_expired");
  return ctx;
}

export async function requireBandId(): Promise<string> {
  return (await requireBandContext()).bandId;
}

/**
 * Páginas de criação/edição: visualizador volta para `fallback` (a listagem/detalhe).
 * A API também recusa (withBand), isto só evita mostrar um formulário que não pode ser salvo.
 */
export async function requireBandEditor(fallback: string): Promise<BandContext> {
  const ctx = await requireBandContext();
  if (!ctx.canEdit) redirect(fallback);
  return ctx;
}

/** Para route handlers do painel: `null` quando não é superadmin ativo. */
export async function requireAdminSession() {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id || session.user.role !== "superadmin") return null;
  if (!(await isAdminActive(id))) return null;
  return { adminId: id, session };
}

/** Para Server Components do painel: redireciona para /admin/login quando não autorizado. */
export async function requireAdminId(): Promise<string> {
  const ctx = await requireAdminSession();
  if (!ctx) redirect("/admin/login");
  return ctx.adminId;
}
