import { NextResponse } from "next/server";
import { jsonError, parseBody, withAdmin } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { stageUpdateSchema } from "@/lib/validations";

type Params = { id: string };

/** Edita palco e executa ações de curadoria (status, marcar como verificado). */
export const PATCH = withAdmin<Params>(async (request, { adminId, params: { id } }) => {
  const parsed = await parseBody(request, stageUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { verify, ...data } = parsed.data;

  const existing = await prisma.stage.findUnique({ where: { id }, select: { status: true, imageUrl: true } });
  if (!existing) return jsonError(404, "Palco não encontrado");

  const publishing = data.status === "PUBLISHED" && existing.status !== "PUBLISHED";
  await prisma.stage.update({
    where: { id },
    data: {
      ...data,
      // Publicar ou "marcar como verificado" registra quem verificou e quando.
      ...((verify || publishing) && { verifiedAt: new Date(), verifiedById: adminId }),
      // Imagem de origem trocada → miniatura antiga descartada (regerada por `npm run stages:images`).
      ...(data.imageUrl !== undefined && data.imageUrl !== existing.imageUrl && { imageThumbUrl: null }),
    },
  });
  return NextResponse.json({ id });
});

/** Exclusão definitiva só para rascunho; publicado/arquivado deve ser arquivado (mantém histórico). */
export const DELETE = withAdmin<Params>(async (_request, { params: { id } }) => {
  const { count } = await prisma.stage.deleteMany({ where: { id, status: "DRAFT" } });
  if (count === 0) {
    const exists = await prisma.stage.count({ where: { id } });
    return exists
      ? jsonError(409, "Só rascunhos podem ser excluídos. Arquive o palco.")
      : jsonError(404, "Palco não encontrado");
  }
  return NextResponse.json({ ok: true });
});
