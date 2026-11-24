import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { repertoireUpdateSchema } from "@/lib/validations";

/**
 * Altera o repertório. Com `songs`, a lista inteira vira a enviada (inclusões, remoções, edições e
 * nova ordem numa transação só). Músicas enviadas com `id` desta lista são ATUALIZADAS (o id não
 * muda: a ordem e as marcações de ensaiada nos ensaios apontam para ele); sem `id` = nova;
 * as que não vieram são removidas (com as marcações delas).
 */
export const PATCH = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, repertoireUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { songs, ...data } = parsed.data;

  const updated = await prisma.$transaction(
    async (tx) => {
      const { count } = await tx.repertoire.updateMany({
        where: { id, bandId },
        data,
      });
      if (count === 0) return false;
      if (songs) {
        const current = await tx.repertoireSong.findMany({
          where: { repertoireId: id },
        });
        const byId = new Map(current.map((s) => [s.id, s]));
        const kept = new Set<string>();
        const toCreate: (Omit<(typeof songs)[number], "id"> & {
          position: number;
          repertoireId: string;
        })[] = [];
        for (const [position, { id: songId, ...song }] of songs.entries()) {
          const existing = songId && !kept.has(songId) ? byId.get(songId) : undefined;
          if (!existing) {
            toCreate.push({ ...song, position, repertoireId: id });
            continue;
          }
          kept.add(existing.id);
          const next = { ...song, position };
          const changed = (Object.keys(next) as (keyof typeof next)[]).some((k) => existing[k] !== next[k]);
          if (changed)
            await tx.repertoireSong.update({
              where: { id: existing.id },
              data: next,
            });
        }
        const removed = current.filter((s) => !kept.has(s.id)).map((s) => s.id);
        if (removed.length)
          await tx.repertoireSong.deleteMany({
            where: { id: { in: removed } },
          });
        if (toCreate.length) await tx.repertoireSong.createMany({ data: toCreate });
      }
      return true;
    },
    { timeout: 20_000 },
  );
  if (!updated) return jsonError(404, "Repertório não encontrado");
  return NextResponse.json({ id });
});

/** Exclui o repertório (os ensaios que o usavam ficam sem repertório). */
export const DELETE = withBand<{ id: string }>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.repertoire.deleteMany({
    where: { id, bandId },
  });
  if (count === 0) return jsonError(404, "Repertório não encontrado");
  return NextResponse.json({ id });
});
