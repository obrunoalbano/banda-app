import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { lastAdminBlock } from "@/lib/members";
import { prisma } from "@/lib/prisma";
import { bandMemberUpdateSchema } from "@/lib/validations";

const memberRef = { id: true, role: true, userId: true } as const;

async function loadMembers(bandId: string) {
  return prisma.bandMember.findMany({ where: { bandId }, select: memberRef });
}

/** Administrador muda nome/papel de um integrante (nunca deixa a banda sem administrador). */
export const PATCH = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, bandMemberUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const members = await loadMembers(bandId);
  const target = members.find((m) => m.id === id);
  if (!target) return jsonError(404, "Integrante não encontrado");
  if (parsed.data.role) {
    const block = lastAdminBlock(members, target, { type: "role", role: parsed.data.role });
    if (block) return jsonError(409, block);
  }
  const { count } = await prisma.bandMember.updateMany({ where: { id, bandId }, data: parsed.data });
  if (count === 0) return jsonError(404, "Integrante não encontrado");
  return NextResponse.json({ id });
});

/** Administrador remove um integrante (ou cancela o convite). O acesso dele à banda acaba na hora. */
export const DELETE = withBand<{ id: string }>(async (_request, { bandId, params: { id } }) => {
  const members = await loadMembers(bandId);
  const target = members.find((m) => m.id === id);
  if (!target) return jsonError(404, "Integrante não encontrado");
  const block = lastAdminBlock(members, target, { type: "remove" });
  if (block) return jsonError(409, block);
  const { count } = await prisma.bandMember.deleteMany({ where: { id, bandId } });
  if (count === 0) return jsonError(404, "Integrante não encontrado");
  return NextResponse.json({ id });
});
