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

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      authorize: async (credentials, request) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email).trim().toLowerCase();

        const limited = rateLimit(`login:${email}:${clientIp(request)}`, RATE_LIMITS.login);
        if (!limited.ok) throw new RateLimitedSignin();

        const band = await prisma.band.findUnique({ where: { email } });
        if (!band) return null;
        const ok = await compare(String(credentials.password), band.passwordHash);
        if (!ok) return null;
        return { id: band.id, name: band.name, email: band.email };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id!;
        token.name = user.name;
        token.email = user.email;
      }
      // `unstable_update({ user: { name, email } })` após editar os dados da banda.
      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string") token.name = session.user.name;
        if (typeof session.user.email === "string") token.email = session.user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = (token.name as string | undefined) ?? null;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
