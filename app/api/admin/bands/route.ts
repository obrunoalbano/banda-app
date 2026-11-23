import { NextResponse } from "next/server";
import { jsonError, parseBody, withAdmin } from "@/lib/api";
import { createBandWithAdmin } from "@/lib/band-access";
import { generateTempPassword, hashPassword } from "@/lib/passwords";
import { prisma } from "@/lib/prisma";
import { adminCreateBandSchema } from "@/lib/validations";

/**
 * Superadmin cria uma banda com um administrador:
 * - email já tem conta → a pessoa vira administradora da nova banda (sem senha nova);
 * - email novo → cria a conta com SENHA PROVISÓRIA (retornada uma única vez; só o hash é salvo).
 */
export const POST = withAdmin(async (request) => {
  const parsed = await parseBody(request, adminCreateBandSchema);
  if (!parsed.ok) return parsed.response;
  const { name, responsible, phone, email } = parsed.data;

  let tempPassword: string | null = null;
  let owner = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, phone: true } });
  if (!owner) {
    tempPassword = generateTempPassword();
    owner = await prisma.user.create({
      data: { name: responsible, email, phone, passwordHash: await hashPassword(tempPassword), mustChangePassword: true },
      select: { id: true, name: true, email: true, phone: true },
    });
  }
  const band = await createBandWithAdmin(owner, name);
  if (!band) return jsonError(503, "Não foi possível criar a banda. Tente novamente.");
  // Contato da banda = o informado no formulário (não o da conta, se ela já existia).
  await prisma.band.update({ where: { id: band.id }, data: { responsible, phone } });
  return NextResponse.json({ id: band.id, email, tempPassword }, { status: 201 });
});
