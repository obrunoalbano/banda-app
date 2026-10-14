/**
 * Regras do envio PÚBLICO do formulário de contato (sem I/O — testável).
 * Rota: app/api/public/v1/bands/[slug]/leads/route.ts. Contrato: docs/integracoes.md.
 */
import { verifyFormToken } from "@/lib/lead-form-token";

export type LeadOriginKind = "app" | "allowed" | "denied";

/** De onde veio o envio: formulário do próprio app, domínio cadastrado pela banda, ou outro. */
export function classifyOrigin(
  origin: string | null,
  appOrigins: string[],
  allowedOrigins: string[],
): LeadOriginKind {
  if (!origin) return "denied";
  const o = origin.toLowerCase();
  if (appOrigins.some((a) => a.toLowerCase() === o)) return "app";
  if (allowedOrigins.includes(o)) return "allowed";
  return "denied";
}

export type SpamVerdict = "accept" | "drop" | "expired";

/**
 * Decide o destino do envio.
 * - honeypot preenchido → drop (resposta "ok" para não ensinar o robô);
 * - formulário do app: token obrigatório; rápido demais → drop; inválido/expirado → expired (pede recarregar);
 * - domínio cadastrado: token opcional (sites externos não emitem); se vier, é validado.
 */
export function spamVerdict({
  honeypot,
  formToken,
  originKind,
  slug,
  now = Date.now(),
}: {
  honeypot: string | undefined;
  formToken: string | undefined;
  originKind: Exclude<LeadOriginKind, "denied">;
  slug: string;
  now?: number;
}): SpamVerdict {
  if (honeypot && honeypot.trim() !== "") return "drop";
  if (!formToken) return originKind === "app" ? "expired" : "accept";
  const check = verifyFormToken(formToken, slug, now);
  if (check === "too-fast") return "drop";
  if (check === "ok") return "accept";
  return "expired";
}

/** Origem do lead quando o formulário não informa (`source`). */
export function defaultLeadSource(originKind: Exclude<LeadOriginKind, "denied">, origin: string): string {
  if (originKind === "app") return "formulario-publico";
  try {
    return new URL(origin).hostname;
  } catch {
    return "site";
  }
}
