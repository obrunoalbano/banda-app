import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { isUniqueViolation, jsonError, parseBody } from "@/lib/api";
import { findAvailableSlug } from "@/lib/band-slug";
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
  if (await prisma.band.findUnique({ where: { email: data.email }, select: { id: true } })) {
    return jsonError(409, "Este email já está cadastrado");
  }

  const passwordHash = await hash(password, 12);
  // O slug pode colidir com um cadastro simultâneo: tenta de novo com o próximo livre.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.band.create({
        data: { ...data, passwordHash, slug: await findAvailableSlug(data.name) },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Email concorrente cadastrado entre a checagem e o create.
      if (await prisma.band.findUnique({ where: { email: data.email }, select: { id: true } })) {
        return jsonError(409, "Este email já está cadastrado");
      }
    }
  }
  return jsonError(503, "Não foi possível concluir o cadastro. Tente novamente.");
}
