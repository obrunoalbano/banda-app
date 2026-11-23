import { NextResponse } from "next/server";
import { jsonError, parseBody } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import {
  generatePasswordResetToken,
  passwordResetBaseUrl,
  passwordResetEmail,
  passwordResetUrl,
} from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { forgotPasswordSchema } from "@/lib/validations";

const tooMany = (retryAfterSeconds: number) =>
  jsonError(429, "Muitas tentativas. Aguarde alguns minutos e tente novamente.", {
    headers: { "Retry-After": String(retryAfterSeconds) },
  });

/**
 * PÚBLICO — "esqueci minha senha" da banda. Responde sempre igual (exista ou não a conta),
 * para não revelar quais emails estão cadastrados.
 */
export async function POST(request: Request) {
  const byIp = rateLimit(`forgot-password:${clientIp(request)}`, RATE_LIMITS.forgotPasswordIp);
  if (!byIp.ok) return tooMany(byIp.retryAfterSeconds);

  const parsed = await parseBody(request, forgotPasswordSchema);
  if (!parsed.ok) return parsed.response;
  const { email } = parsed.data;

  const byEmail = rateLimit(`forgot-password-email:${email}`, RATE_LIMITS.forgotPasswordEmail);
  if (!byEmail.ok) return tooMany(byEmail.retryAfterSeconds);

  const baseUrl = passwordResetBaseUrl({
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    requestUrl: request.url,
    isProduction: process.env.NODE_ENV === "production",
  });
  if (!baseUrl) {
    console.error("[password-reset] NEXT_PUBLIC_APP_URL não configurada — link de redefinição não enviado.");
    return NextResponse.json({ ok: true });
  }

  const band = await prisma.band.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, disabledAt: true },
  });
  if (band && !band.disabledAt) {
    const { token, hash, expiresAt } = generatePasswordResetToken();
    await prisma.band.update({
      where: { id: band.id },
      data: { passwordResetTokenHash: hash, passwordResetExpiresAt: expiresAt },
    });
    await sendEmail({ to: band.email, ...passwordResetEmail({ bandName: band.name, url: passwordResetUrl(baseUrl, token) }) });
  }
  return NextResponse.json({ ok: true });
}
