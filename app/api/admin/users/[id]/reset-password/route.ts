import { NextResponse } from "next/server";
import { jsonError, withAdmin } from "@/lib/api";
import { generateTempPassword, hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";

/** Gera nova senha provisória para o usuário (retornada uma única vez; troca obrigatória no acesso). */
export const POST = withAdmin<{ id: string }>(async (_request, { params: { id } }) => {
  const tempPassword = generateTempPassword();
  const { count } = await prisma.user.updateMany({
    where: { id },
    data: {
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });
  if (count === 0) return jsonError(404, "Conta não encontrada");
  return NextResponse.json({ tempPassword });
});
