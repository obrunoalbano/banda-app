import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Token de formulário (anti-spam): emitido quando a página do formulário é renderizada,
 * assinado com AUTH_SECRET. Prova que o envio veio de um formulário aberto pelo app e
 * permite descartar envios rápidos demais (robôs) ou muito antigos.
 * Não é segredo do usuário nem autenticação — só eleva o custo de spam automatizado.
 */

export const FORM_TOKEN_MIN_AGE_MS = 3_000;
export const FORM_TOKEN_MAX_AGE_MS = 24 * 60 * 60_000;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não definido");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`lead-form:${payload}`).digest("base64url");
}

export function issueFormToken(slug: string, now: number = Date.now()): string {
  const payload = `${slug}.${now}`;
  return `${payload}.${sign(payload)}`;
}

export type FormTokenCheck = "ok" | "invalid" | "too-fast" | "expired";

export function verifyFormToken(token: string, slug: string, now: number = Date.now()): FormTokenCheck {
  const parts = token.split(".");
  if (parts.length !== 3) return "invalid";
  const [tokenSlug, issuedRaw, signature] = parts;
  if (tokenSlug !== slug) return "invalid";
  const expected = Buffer.from(sign(`${tokenSlug}.${issuedRaw}`));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return "invalid";
  const issued = Number(issuedRaw);
  if (!Number.isFinite(issued)) return "invalid";
  const age = now - issued;
  if (age < FORM_TOKEN_MIN_AGE_MS) return "too-fast";
  if (age > FORM_TOKEN_MAX_AGE_MS) return "expired";
  return "ok";
}
