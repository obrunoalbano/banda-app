import { NextResponse } from "next/server";
import { jsonError, parseBody, withAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { adminUpdateBandSchema } from "@/lib/validations";

/** Desativa/reativa a banda (ninguém a acessa enquanto desativada; as contas dos integrantes continuam). */
export const PATCH = withAdmin<{ id: string }>(async (request, { params: { id } }) => {
  const parsed = await parseBody(request, adminUpdateBandSchema);
  if (!parsed.ok) return parsed.response;
  const { count } = await prisma.band.updateMany({
    where: { id },
    data: { disabledAt: parsed.data.disabled ? new Date() : null },
  });
  if (count === 0) return jsonError(404, "Banda não encontrada");
  return NextResponse.json({ id, disabled: parsed.data.disabled });
});
