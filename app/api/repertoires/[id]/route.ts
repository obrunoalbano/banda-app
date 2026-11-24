import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { repertoireUpdateSchema } from "@/lib/validations";

/**
 * Altera o repertório. Com `songs`, a lista inteira é substituída na ordem enviada (inclusões,
 * remoções, edições e nova ordem numa transação só).
 */
export const PATCH = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, repertoireUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { songs, ...data } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    const { count } = await tx.repertoire.updateMany({ where: { id, bandId }, data });
    if (count === 0) return false;
    if (songs) {
      await tx.repertoireSong.deleteMany({ where: { repertoireId: id } });
      await tx.repertoireSong.createMany({
        data: songs.map((song, position) => ({ ...song, position, repertoireId: id })),
      });
    }
    return true;
  });
  if (!updated) return jsonError(404, "Repertório não encontrado");
  return NextResponse.json({ id });
});

/** Exclui o repertório (os ensaios que o usavam ficam sem repertório). */
export const DELETE = withBand<{ id: string }>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.repertoire.deleteMany({ where: { id, bandId } });
  if (count === 0) return jsonError(404, "Repertório não encontrado");
  return NextResponse.json({ id });
});
