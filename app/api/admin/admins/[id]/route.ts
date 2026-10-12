import { NextResponse } from "next/server";
import { jsonError, parseBody, withAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { adminUpdateBandSchema } from "@/lib/validations";

/** Desativa/reativa superadmin. Ninguém desativa a própria conta (evita ficar sem acesso). */
export const PATCH = withAdmin<{ id: string }>(async (request, { adminId, params: { id } }) => {
  const parsed = await parseBody(request, adminUpdateBandSchema);
  if (!parsed.ok) return parsed.response;
  if (id === adminId && parsed.data.disabled) {
    return jsonError(409, "Você não pode desativar a sua própria conta.");
  }
  const { count } = await prisma.adminUser.updateMany({
    where: { id },
    data: { disabledAt: parsed.data.disabled ? new Date() : null },
  });
  if (count === 0) return jsonError(404, "Administrador não encontrado");
  return NextResponse.json({ id, disabled: parsed.data.disabled });
});
