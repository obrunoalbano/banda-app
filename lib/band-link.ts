import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Link de convite da banda (para o grupo): um link reutilizável que qualquer pessoa usa para
 * entrar na banda com o acesso escolhido pelo administrador (`Band.inviteLinkRole`).
 *
 * Token = `<nonce>.<assinatura>`. O banco guarda só o nonce; a assinatura é HMAC-SHA256 com
 * AUTH_SECRET. Assim o administrador vê o link de novo a qualquer momento (é derivável), mas
 * vazar o banco não vaza links válidos. Gerar um novo nonce invalida o link anterior.
 */

export const BAND_LINK_PAGE = "/convite/banda";

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não definido");
  return s;
}

function sign(nonce: string): string {
  return createHmac("sha256", secret()).update(`band-invite-link:${nonce}`).digest("base64url");
}

/** Novo nonce (128 bits). */
export function generateBandLinkNonce(): string {
  return randomBytes(16).toString("base64url");
}

export function bandLinkToken(nonce: string): string {
  return `${nonce}.${sign(nonce)}`;
}

/** Nonce do token se a assinatura confere; `null` caso contrário (sem consultar o banco). */
export function parseBandLinkToken(token: string): string | null {
  if (!token || token.length > 200) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [nonce, signature] = parts;
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(nonce)) return null;
  const expected = Buffer.from(sign(nonce));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return nonce;
}

export function bandLinkUrl(baseUrl: string, nonce: string): string {
  return `${baseUrl}${BAND_LINK_PAGE}/${encodeURIComponent(bandLinkToken(nonce))}`;
}
