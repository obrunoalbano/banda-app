import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { resolveSongOrder, SONG_ORDER_CONFLICT } from "@/lib/repertoire";
import { rehearsalSongOrderSchema } from "@/lib/validations";

/**
 * Ordem das músicas do repertório NESTE show (o repertório não muda). Recebe todas as músicas na
 * nova ordem; a ordem igual à do repertório (ou lista vazia) volta a seguir o repertório.
 */
export const PATCH = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, rehearsalSongOrderSchema);
  if (!parsed.ok) return parsed.response;

  const show = await prisma.show.findFirst({
    where: { id, bandId },
    select: { repertoire: { select: { songs: { orderBy: { position: "asc" }, select: { id: true } } } } },
  });
  if (!show) return jsonError(404, "Show não encontrado");
  if (!show.repertoire) return jsonError(400, "Este show não tem repertório");

  const order = resolveSongOrder(
    parsed.data.songIds,
    show.repertoire.songs.map((s) => s.id),
  );
  if (!order.ok) return jsonError(409, SONG_ORDER_CONFLICT);
  await prisma.show.updateMany({ where: { id, bandId }, data: { songOrder: order.songOrder } });
  return NextResponse.json({ id, followsRepertoire: order.songOrder.length === 0 });
});
