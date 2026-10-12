import { NextResponse } from "next/server";
import { isUniqueViolation, jsonError, parseBody, withAdmin } from "@/lib/api";
import { generateTempPassword, hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { adminCreateAdminSchema } from "@/lib/validations";

/** Superadmin cria outro superadmin (senha provisória, troca obrigatória no primeiro acesso). */
export const POST = withAdmin(async (request) => {
  const parsed = await parseBody(request, adminCreateAdminSchema);
  if (!parsed.ok) return parsed.response;
  const tempPassword = generateTempPassword();
  try {
    const admin = await prisma.adminUser.create({
      data: { ...parsed.data, passwordHash: await hashPassword(tempPassword), mustChangePassword: true },
      select: { id: true, email: true },
    });
    return NextResponse.json({ ...admin, tempPassword }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError(409, "Já existe um administrador com este email");
    throw error;
  }
});
