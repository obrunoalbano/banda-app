/**
 * Controle de acesso por rota (executado no proxy.ts). Função pura — coberta por teste.
 *
 * Papéis:
 * - "band"       → conta de banda (app em /casas, /shows… e APIs /api/*).
 * - "superadmin" → equipe do produto (painel /admin e APIs /api/admin/*).
 * Um papel nunca acessa a área do outro. Senha provisória obriga a trocar antes de qualquer coisa.
 */

export type Role = "band" | "superadmin";

export type SessionClaims = { role: Role; mustChangePassword: boolean } | null;

export type AccessDecision =
  | { type: "allow" }
  | { type: "redirect"; to: string; withCallback?: boolean }
  | { type: "json"; status: 401 | 403; error: string };

export const BAND_PASSWORD_PAGE = "/banda/senha";
export const ADMIN_PASSWORD_PAGE = "/admin/senha";
export const ADMIN_LOGIN_PAGE = "/admin/login";

/** APIs sem sessão (cada uma tem sua própria proteção: token, rate limit, opt-in…). */
const PUBLIC_API = new Set(["/api/register", "/api/leads/ingest"]);

/** Páginas públicas do app (sem sessão). */
function isPublicPage(path: string, isProduction: boolean): boolean {
  return (
    path === "/" ||
    path === "/login" ||
    path === "/cadastro" ||
    // Galeria do design system: só existe em desenvolvimento (a página dá 404 em produção).
    (!isProduction && path === "/design-system")
  );
}

/** Superfícies públicas das integrações (página/widget/API pública e script do widget). */
export function isPublicIntegrationPath(path: string): boolean {
  return (
    path.startsWith("/b/") ||
    path.startsWith("/embed/") ||
    path === "/embed.js" ||
    path.startsWith("/api/public/")
  );
}

const forbiddenJson = (error: string): AccessDecision => ({ type: "json", status: 403, error });

export function decideAccess(
  path: string,
  session: SessionClaims,
  { isProduction }: { isProduction: boolean },
): AccessDecision {
  if (isPublicIntegrationPath(path)) return { type: "allow" };
  if (path.startsWith("/api/auth")) return { type: "allow" };

  const isApi = path.startsWith("/api/");
  const isAdminArea = path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/");

  // ── Painel superadmin ──────────────────────────────────────────────
  if (isAdminArea) {
    if (path === ADMIN_LOGIN_PAGE) {
      return session?.role === "superadmin" ? { type: "redirect", to: "/admin" } : { type: "allow" };
    }
    if (!session) {
      return isApi
        ? { type: "json", status: 401, error: "Não autorizado" }
        : { type: "redirect", to: ADMIN_LOGIN_PAGE, withCallback: true };
    }
    if (session.role !== "superadmin") {
      return isApi ? forbiddenJson("Acesso restrito à equipe.") : { type: "redirect", to: "/casas" };
    }
    if (session.mustChangePassword && path !== ADMIN_PASSWORD_PAGE && path !== "/api/admin/password") {
      return isApi
        ? forbiddenJson("Defina uma nova senha antes de continuar.")
        : { type: "redirect", to: ADMIN_PASSWORD_PAGE };
    }
    return { type: "allow" };
  }

  // ── APIs do app da banda ───────────────────────────────────────────
  if (isApi) {
    if (PUBLIC_API.has(path)) return { type: "allow" };
    if (!session) return { type: "json", status: 401, error: "Não autorizado" };
    if (session.role !== "band") return forbiddenJson("Esta área é das bandas.");
    if (session.mustChangePassword && path !== "/api/band/password") {
      return forbiddenJson("Defina uma nova senha antes de continuar.");
    }
    return { type: "allow" };
  }

  // ── Páginas do app da banda ────────────────────────────────────────
  if (isPublicPage(path, isProduction)) return { type: "allow" };
  if (!session) return { type: "redirect", to: "/login", withCallback: true };
  if (session.role === "superadmin") return { type: "redirect", to: "/admin" };
  if (session.mustChangePassword && path !== BAND_PASSWORD_PAGE) {
    return { type: "redirect", to: BAND_PASSWORD_PAGE };
  }
  return { type: "allow" };
}
