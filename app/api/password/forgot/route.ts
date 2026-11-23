import { NextResponse } from "next/server";
import { jsonError, parseBody } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import {
  generatePasswordResetToken,
  emailLinkBaseUrl,
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
 * PÚBLICO — "esqueci minha senha" do usuário do app. Responde sempre igual (exista ou não a conta),
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

  const baseUrl = emailLinkBaseUrl(request.url);
  if (!baseUrl) {
    console.error("[password-reset] NEXT_PUBLIC_APP_URL/VERCEL_PROJECT_PRODUCTION_URL ausentes — link de redefinição não enviado.");
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, disabledAt: true },
  });
  if (user && !user.disabledAt) {
    const { token, hash, expiresAt } = generatePasswordResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: hash, passwordResetExpiresAt: expiresAt },
    });
    await sendEmail({ to: user.email, ...passwordResetEmail({ name: user.name, url: passwordResetUrl(baseUrl, token) }) });
  }
  return NextResponse.json({ ok: true });
}
