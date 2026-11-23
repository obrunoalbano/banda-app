import { createHash, randomBytes } from "node:crypto";
import { PRODUCT_NAME } from "@/components/ui/Brand";

/**
 * "Esqueci minha senha" do usuário do app: token aleatório de 256 bits enviado por email.
 * O banco guarda só o SHA-256 (como o token de ingestão) — vazar o banco não vaza links válidos.
 * Um token por conta (pedir de novo invalida o anterior), uso único, validade curta.
 */

export const PASSWORD_RESET_TTL_MS = 60 * 60_000;
export const PASSWORD_RESET_TTL_LABEL = "1 hora";
export const PASSWORD_RESET_PAGE = "/redefinir-senha";

export function hashPasswordResetToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generatePasswordResetToken(now: number = Date.now()) {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashPasswordResetToken(token), expiresAt: new Date(now + PASSWORD_RESET_TTL_MS) };
}

/**
 * Base dos links enviados por email (redefinição de senha, convite). Em produção não confia no
 * Host da requisição — isso permitiria a um atacante enviar à vítima um link para o domínio dele
 * (password reset poisoning). Ordem: NEXT_PUBLIC_APP_URL → domínio de produção do projeto na
 * Vercel (`VERCEL_PROJECT_PRODUCTION_URL`, variável de sistema, sem protocolo) → origem da
 * requisição só fora de produção.
 */
export function passwordResetBaseUrl({
  appUrl,
  vercelProductionHost,
  requestUrl,
  isProduction,
}: {
  appUrl: string | undefined;
  vercelProductionHost?: string | undefined;
  requestUrl: string;
  isProduction: boolean;
}): string | null {
  const fromEnv = appUrl?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  const host = vercelProductionHost?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (host) return `https://${host}`;
  return isProduction ? null : new URL(requestUrl).origin;
}

/** `passwordResetBaseUrl` com as variáveis de ambiente do processo. */
export function emailLinkBaseUrl(requestUrl: string): string | null {
  return passwordResetBaseUrl({
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    vercelProductionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    requestUrl,
    isProduction: process.env.NODE_ENV === "production",
  });
}

export function passwordResetUrl(baseUrl: string, token: string): string {
  return `${baseUrl}${PASSWORD_RESET_PAGE}?token=${encodeURIComponent(token)}`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function passwordResetEmail({ name, url }: { name: string; url: string }) {
  const subject = `Redefinir sua senha — ${PRODUCT_NAME}`;
  const text = [
    `Olá, ${name}!`,
    "",
    `Recebemos um pedido para redefinir a senha da sua conta no ${PRODUCT_NAME}.`,
    `Para criar uma nova senha, abra o link abaixo (vale por ${PASSWORD_RESET_TTL_LABEL} e só pode ser usado uma vez):`,
    "",
    url,
    "",
    "Se você não pediu, ignore este email: sua senha continua a mesma.",
  ].join("\n");
  const html = `<p>Olá, ${escapeHtml(name)}!</p>
<p>Recebemos um pedido para redefinir a senha da sua conta no ${PRODUCT_NAME}.</p>
<p><a href="${escapeHtml(url)}">Criar nova senha</a></p>
<p>O link vale por ${PASSWORD_RESET_TTL_LABEL} e só pode ser usado uma vez.</p>
<p>Se você não pediu, ignore este email: sua senha continua a mesma.</p>`;
  return { subject, text, html };
}
