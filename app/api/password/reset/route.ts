import { NextResponse } from "next/server";
import { jsonError, parseBody } from "@/lib/api";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { resetPasswordSchema } from "@/lib/validations";

/** PÚBLICO — define a nova senha da banda com o token do email (uso único). */
export async function POST(request: Request) {
  const limited = rateLimit(`reset-password:${clientIp(request)}`, RATE_LIMITS.resetPassword);
  if (!limited.ok) {
    return jsonError(429, "Muitas tentativas. Aguarde alguns minutos e tente novamente.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  const parsed = await parseBody(request, resetPasswordSchema);
  if (!parsed.ok) return parsed.response;

  // Uma query só: confere token, validade e conta ativa, troca a senha e consome o token.
  const { count } = await prisma.band.updateMany({
    where: {
      passwordResetTokenHash: hashPasswordResetToken(parsed.data.token),
      passwordResetExpiresAt: { gt: new Date() },
      disabledAt: null,
    },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      mustChangePassword: false,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
  if (count === 0) return jsonError(400, "Este link é inválido ou expirou. Peça um novo.");
  return NextResponse.json({ ok: true });
}
