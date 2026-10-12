import { NextResponse } from "next/server";
import { isUniqueViolation, jsonError, parseBody, withAdmin } from "@/lib/api";
import { findAvailableSlug } from "@/lib/band-slug";
import { generateTempPassword, hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { adminCreateBandSchema } from "@/lib/validations";

/**
 * Superadmin cria conta de banda com SENHA PROVISÓRIA (retornada uma única vez; só o hash é salvo).
 * A banda é obrigada a trocá-la no primeiro acesso.
 */
export const POST = withAdmin(async (request) => {
  const parsed = await parseBody(request, adminCreateBandSchema);
  if (!parsed.ok) return parsed.response;
  const data = parsed.data;

  if (await prisma.band.findUnique({ where: { email: data.email }, select: { id: true } })) {
    return jsonError(409, "Já existe uma conta com este email");
  }
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const band = await prisma.band.create({
        data: { ...data, passwordHash, mustChangePassword: true, slug: await findAvailableSlug(data.name) },
        select: { id: true, email: true },
      });
      return NextResponse.json({ ...band, tempPassword }, { status: 201 });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      if (await prisma.band.findUnique({ where: { email: data.email }, select: { id: true } })) {
        return jsonError(409, "Já existe uma conta com este email");
      }
    }
  }
  return jsonError(503, "Não foi possível criar a conta. Tente novamente.");
});
