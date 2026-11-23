import { NextResponse } from "next/server";
import { unstable_update } from "@/auth";
import { isUniqueViolation, jsonError, parseBody, withUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { accountUpdateSchema } from "@/lib/validations";

/** Dados da própria conta (nome, telefone, email de login). */
export const PATCH = withUser(async (request, { userId }) => {
  const parsed = await parseBody(request, accountUpdateSchema);
  if (!parsed.ok) return parsed.response;
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: parsed.data,
      select: { id: true, name: true, email: true, phone: true },
    });
    // Mantém nome/email do JWT em sincronia (menu lateral, etc.).
    await unstable_update({ user: { name: user.name, email: user.email } });
    return NextResponse.json(user);
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError(409, "Este email já está em uso");
    throw error;
  }
});
