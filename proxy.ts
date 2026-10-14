import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { decideAccess, isPublicIntegrationPath, type SessionClaims } from "@/lib/access";

/**
 * Proxy (antigo middleware no Next ≤15). Protege tudo por padrão e separa as áreas por papel
 * (banda × superadmin). As regras ficam em lib/access.ts (função pura, com teste).
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // Superfícies públicas de integração: nem decodifica o JWT (rotas de maior tráfego).
  if (isPublicIntegrationPath(path)) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET não definido");
  }

  // Em HTTPS (ex.: Vercel), o cookie de sessão usa o prefixo `__Secure-`.
  // O `getToken` assume `secureCookie: false` por padrão e procura o nome errado.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const secureCookie = forwardedProto === "https" || request.nextUrl.protocol === "https:";

  const token = secret ? await getToken({ req: request, secret, secureCookie }) : null;
  const session: SessionClaims = token
    ? {
        // Tokens emitidos antes dos papéis existirem são de banda.
        role: token.role === "superadmin" ? "superadmin" : "band",
        mustChangePassword: token.mustChangePassword === true,
      }
    : null;

  const decision = decideAccess(path, session, { isProduction: process.env.NODE_ENV === "production" });
  if (decision.type === "allow") return NextResponse.next();
  if (decision.type === "json") {
    return NextResponse.json({ error: decision.error }, { status: decision.status });
  }
  const target = new URL(decision.to, request.nextUrl.origin);
  if (decision.withCallback) target.searchParams.set("callbackUrl", path);
  return NextResponse.redirect(target);
}

export const config = {
  matcher: [
    // _vercel: scripts da plataforma (Analytics) — nunca passam pelo controle de acesso.
    "/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
