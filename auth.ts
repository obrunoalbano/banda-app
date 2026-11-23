import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { clientIp } from "@/lib/request";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

/** Vira `?error=CredentialsSignin&code=rate_limited` na URL do login. */
class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

/** Conta desativada por um superadmin (`?code=disabled`). */
class DisabledSignin extends CredentialsSignin {
  code = "disabled";
}

const credentialsFields = {
  email: { label: "Email", type: "email" },
  password: { label: "Senha", type: "password" },
};

function readCredentials(credentials: Partial<Record<string, unknown>> | undefined) {
  if (!credentials?.email || !credentials?.password) return null;
  return { email: String(credentials.email).trim().toLowerCase(), password: String(credentials.password) };
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    // Login do USUÁRIO do app (acessa N bandas). id padrão "credentials" — usado por components/LoginForm.tsx.
    Credentials({
      credentials: credentialsFields,
      authorize: async (credentials, request) => {
        const input = readCredentials(credentials);
        if (!input) return null;

        const limited = rateLimit(`login:${input.email}:${clientIp(request)}`, RATE_LIMITS.login);
        if (!limited.ok) throw new RateLimitedSignin();

        const user = await prisma.user.findUnique({ where: { email: input.email } });
        if (!user) return null;
        const ok = await compare(input.password, user.passwordHash);
        if (!ok) return null;
        // Só revela "desativada" depois da senha correta (não confirma emails para terceiros).
        if (user.disabledAt) throw new DisabledSignin();
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "user",
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
    // Login do SUPERADMIN (painel /admin). Tabela separada: AdminUser.
    Credentials({
      id: "admin",
      name: "Painel administrativo",
      credentials: credentialsFields,
      authorize: async (credentials, request) => {
        const input = readCredentials(credentials);
        if (!input) return null;

        const limited = rateLimit(`admin-login:${input.email}:${clientIp(request)}`, RATE_LIMITS.login);
        if (!limited.ok) throw new RateLimitedSignin();

        const admin = await prisma.adminUser.findUnique({ where: { email: input.email } });
        if (!admin) return null;
        const ok = await compare(input.password, admin.passwordHash);
        if (!ok) return null;
        if (admin.disabledAt) throw new DisabledSignin();
        await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: "superadmin",
          mustChangePassword: admin.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id!;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role ?? "user";
        token.mustChangePassword = user.mustChangePassword ?? false;
      }
      // `unstable_update({ user: {...} })`: dados da conta editados e troca de senha.
      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string") token.name = session.user.name;
        if (typeof session.user.email === "string") token.email = session.user.email;
        if (session.user.mustChangePassword === false) token.mustChangePassword = false;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = (token.name as string | undefined) ?? null;
        session.user.email = token.email as string;
        // Tokens antigos ("band" = conta de banda, antes de multi-bandas) são de usuário do app.
        session.user.role = token.role === "superadmin" ? "superadmin" : "user";
        session.user.mustChangePassword = token.mustChangePassword ?? false;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
