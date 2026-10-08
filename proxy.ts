import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Proxy (antigo middleware no Next ≤15). Protege tudo por padrão:
 * páginas sem sessão → /login; API sem sessão → 401. Rotas públicas são listadas abaixo.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET não definido");
  }

  // Em HTTPS (ex.: Vercel), o cookie de sessão usa o prefixo `__Secure-`.
  // O `getToken` assume `secureCookie: false` por padrão e procura o nome errado.
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const secureCookie =
    forwardedProto === "https" || request.nextUrl.protocol === "https:";

  const token = secret
    ? await getToken({ req: request, secret, secureCookie })
    : null;

  if (path.startsWith("/api/")) {
    if (
      path.startsWith("/api/auth") ||
      path === "/api/register" ||
      path === "/api/leads/ingest"
    ) {
      return NextResponse.next();
    }
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const isPublic =
    path === "/" ||
    path === "/login" ||
    path === "/cadastro";

  if (isPublic) return NextResponse.next();

  if (!token) {
    const login = new URL("/login", request.nextUrl.origin);
    login.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
