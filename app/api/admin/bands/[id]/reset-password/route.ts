import { NextResponse } from "next/server";
import { jsonError, withAdmin } from "@/lib/api";
import { generateTempPassword, hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

/** Gera nova senha provisória para a banda (retornada uma única vez; troca obrigatória no acesso). */
export const POST = withAdmin<{ id: string }>(async (_request, { params: { id } }) => {
  const tempPassword = generateTempPassword();
  const { count } = await prisma.band.updateMany({
    where: { id },
    data: { passwordHash: await hashPassword(tempPassword), mustChangePassword: true },
  });
  if (count === 0) return jsonError(404, "Banda não encontrada");
  return NextResponse.json({ tempPassword });
});
