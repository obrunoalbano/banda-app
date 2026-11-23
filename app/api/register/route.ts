import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { isUniqueViolation, jsonError, parseBody } from "@/lib/api";
import { claimInvite, createBandWithAdmin, findPendingInvite, setActiveBandCookie } from "@/lib/band-access";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { registerSchema } from "@/lib/validations";

const EMAIL_TAKEN = "Este email já está cadastrado. Entre com ele (ou use “Esqueci minha senha”).";

/**
 * PÚBLICO — cadastro de usuário.
 * - Sem convite: cria a conta e a primeira banda (a pessoa é administradora dela).
 * - Com convite (`inviteToken`): cria a conta com o email do convite e entra na banda que convidou.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`register:${clientIp(request)}`, RATE_LIMITS.register);
  if (!limited.ok) {
    return jsonError(429, "Muitas tentativas. Tente novamente mais tarde.", {
      headers: { "Retry-After": String(limited.retryAfterSeconds) },
    });
  }

  const parsed = await parseBody(request, registerSchema);
  if (!parsed.ok) return parsed.response;
  const { password, bandName, inviteToken, ...data } = parsed.data;

  const invite = inviteToken ? await findPendingInvite(inviteToken) : null;
  if (inviteToken) {
    if (!invite || invite.band.disabledAt) return jsonError(400, "Convite inválido ou expirado. Peça um novo link à banda.");
    // O convite vale para o email que a banda cadastrou (é para lá que o link foi enviado).
    if (invite.email !== data.email) return jsonError(400, `Use o email do convite: ${invite.email}`);
  }

  if (await prisma.user.findUnique({ where: { email: data.email }, select: { id: true } })) {
    return jsonError(409, EMAIL_TAKEN);
  }

  let user: { id: string; name: string; email: string; phone: string | null };
  try {
    user = await prisma.user.create({
      data: { ...data, phone: data.phone ?? null, passwordHash: await hash(password, 12) },
      select: { id: true, name: true, email: true, phone: true },
    });
  } catch (error) {
    // Email concorrente cadastrado entre a checagem e o create.
    if (isUniqueViolation(error)) return jsonError(409, EMAIL_TAKEN);
    throw error;
  }

  if (invite) {
    await claimInvite(invite.id, user.id);
    return setActiveBandCookie(NextResponse.json({ ok: true, bandId: invite.bandId }, { status: 201 }), invite.bandId);
  }

  const band = await createBandWithAdmin(user, bandName!);
  if (!band) {
    // Conta criada; a banda pode ser criada depois em /bandas.
    return NextResponse.json({ ok: true, bandId: null }, { status: 201 });
  }
  return setActiveBandCookie(NextResponse.json({ ok: true, bandId: band.id }, { status: 201 }), band.id);
}
