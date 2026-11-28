import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { resolveSongOrder, SONG_ORDER_CONFLICT } from "@/lib/repertoire";
import { rehearsalSongOrderSchema } from "@/lib/validations";

/**
 * Ordem das músicas do repertório NESTE ensaio (o repertório não muda). Recebe todas as músicas
 * na nova ordem; a ordem igual à do repertório (ou lista vazia) volta a seguir o repertório.
 */
export const PATCH = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, rehearsalSongOrderSchema);
  if (!parsed.ok) return parsed.response;
  const { songIds } = parsed.data;

  const rehearsal = await prisma.rehearsal.findFirst({
    where: { id, bandId },
    select: {
      repertoire: {
        select: {
          songs: { orderBy: { position: "asc" }, select: { id: true } },
        },
      },
    },
  });
  if (!rehearsal) return jsonError(404, "Ensaio não encontrado");
  if (!rehearsal.repertoire) return jsonError(400, "Este ensaio não tem repertório");

  const order = resolveSongOrder(
    songIds,
    rehearsal.repertoire.songs.map((s) => s.id),
  );
  if (!order.ok) return jsonError(409, SONG_ORDER_CONFLICT);
  const { songOrder } = order;
  await prisma.rehearsal.updateMany({
    where: { id, bandId },
    data: { songOrder },
  });
  return NextResponse.json({ id, followsRepertoire: songOrder.length === 0 });
});
