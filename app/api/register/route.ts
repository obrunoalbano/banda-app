import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { isUniqueViolation, jsonError, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { registerBandSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const limited = rateLimit(`register:${clientIp(request)}`, RATE_LIMITS.register);
  if (!limited.ok) {
    return jsonError(429, "Muitas tentativas. Tente novamente mais tarde.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  const parsed = await parseBody(request, registerBandSchema);
  if (!parsed.ok) return parsed.response;

  const { password, ...data } = parsed.data;
  try {
    await prisma.band.create({
      data: { ...data, passwordHash: await hash(password, 12) },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError(409, "Este email já está cadastrado");
    throw error;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
