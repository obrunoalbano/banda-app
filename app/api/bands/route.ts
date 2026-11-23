import { NextResponse } from "next/server";
import { jsonError, parseBody, withUser } from "@/lib/api";
import { createBandWithAdmin, setActiveBandCookie } from "@/lib/band-access";
import { prisma } from "@/lib/prisma";
import { bandCreateSchema } from "@/lib/validations";

/** Usuário cria mais uma banda (vira administrador dela) e passa a usá-la. */
export const POST = withUser(async (request, { userId }) => {
  const parsed = await parseBody(request, bandCreateSchema);
  if (!parsed.ok) return parsed.response;
  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });
  if (!owner) return jsonError(401, "Não autorizado");
  const band = await createBandWithAdmin(owner, parsed.data.name);
  if (!band) return jsonError(503, "Não foi possível criar a banda. Tente novamente.");
  return setActiveBandCookie(NextResponse.json({ id: band.id }, { status: 201 }), band.id);
});
