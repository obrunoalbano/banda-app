import { NextResponse } from "next/server";
import { jsonError, parseBody, withAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { adminUpdateBandSchema } from "@/lib/validations";

/** Desativa/reativa conta de banda (desativada não faz login e perde o acesso na hora). */
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
