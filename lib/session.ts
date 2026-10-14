import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** `auth()` deduplicado por request (layout + page não decodificam o JWT duas vezes). */
export const getSession = cache(auth);

/**
 * Conta ainda ativa? Checado no banco a cada request (deduplicado), para que desativar uma
 * conta no painel corte o acesso na hora — o JWT sozinho continuaria válido por até 30 dias.
 */
const isBandActive = cache(async (id: string) => {
  const band = await prisma.band.findUnique({ where: { id }, select: { disabledAt: true } });
  return !!band && !band.disabledAt;
});

const isAdminActive = cache(async (id: string) => {
  const admin = await prisma.adminUser.findUnique({ where: { id }, select: { disabledAt: true } });
  return !!admin && !admin.disabledAt;
});

/** Para route handlers da banda: `null` quando não autenticado, não é banda ou conta desativada. */
export async function requireBandSession() {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id || session.user.role !== "band") return null;
  if (!(await isBandActive(id))) return null;
  return { bandId: id, session };
}

/** Para Server Components do app da banda: redireciona para /login quando não autorizado. */
export async function requireBandId(): Promise<string> {
  const ctx = await requireBandSession();
  if (!ctx) redirect("/login?code=disabled_or_expired");
  return ctx.bandId;
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
