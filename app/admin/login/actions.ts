"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

/** `email` volta para o formulário: o React 19 reseta o form ao fim da action (não apagar o que foi digitado). */
export type AdminLoginState = { error: string | null; email: string };

/**
 * Login do painel via Server Action: erros voltam para /admin/login (o fluxo de cliente do
 * next-auth redirecionaria falhas para /login, a página das bandas).
 *
 * O destino é decidido aqui (senha provisória → /admin/senha), sem depender do redirect do
 * proxy: numa navegação disparada por Server Action, o roteador renderiza o destino do
 * redirect do proxy mas mantém a URL antiga na barra de endereço.
 */
export async function adminLogin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  try {
    await signIn("admin", { email, password: String(formData.get("password") ?? ""), redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = "code" in error ? (error as { code?: string }).code : undefined;
      if (code === "rate_limited") return { error: "Muitas tentativas. Aguarde alguns minutos.", email };
      if (code === "disabled") return { error: "Esta conta de administrador está desativada.", email };
      return { error: "Email ou senha incorretos.", email };
    }
    throw error;
  }
  const admin = await prisma.adminUser.findUnique({ where: { email }, select: { mustChangePassword: true } });
  redirect(admin?.mustChangePassword ? "/admin/senha" : "/admin/palcos");
}
