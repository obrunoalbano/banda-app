import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isOccurrence } from "@/lib/rehearsals";
import { parseDateOnly, todayDateOnly } from "@/lib/shows";
import { rehearsalSongCheckSchema } from "@/lib/validations";

/**
 * Marca uma música do repertório como ensaiada ou que faltou numa data do ensaio (`status: null`
 * tira a marcação). Só datas que já chegaram (até hoje) e que são do ensaio.
 */
export const POST = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, rehearsalSongCheckSchema);
  if (!parsed.ok) return parsed.response;
  const { songId, status } = parsed.data;
  const occurrenceDate = parseDateOnly(parsed.data.occurrenceDate);
  if (!occurrenceDate) return jsonError(400, "Data inválida");

  const rehearsal = await prisma.rehearsal.findFirst({
    where: { id, bandId },
    select: {
      date: true,
      recurrence: true,
      recurrenceUntil: true,
      repertoireId: true,
    },
  });
  if (!rehearsal) return jsonError(404, "Ensaio não encontrado");
  if (!isOccurrence(rehearsal, occurrenceDate)) return jsonError(400, "Essa data não é deste ensaio");
  if (occurrenceDate > todayDateOnly()) {
    return jsonError(400, "Dá para marcar as músicas a partir do dia do ensaio.");
  }
  const song = rehearsal.repertoireId
    ? await prisma.repertoireSong.findFirst({
        where: { id: songId, repertoireId: rehearsal.repertoireId },
        select: { id: true },
      })
    : null;
  if (!song) return jsonError(404, "Música não encontrada no repertório do ensaio");

  const key = {
    rehearsalId_songId_occurrenceDate: {
      rehearsalId: id,
      songId,
      occurrenceDate,
    },
  };
  if (status === null) {
    await prisma.rehearsalSongCheck.deleteMany({
      where: { rehearsalId: id, songId, occurrenceDate },
    });
  } else {
    await prisma.rehearsalSongCheck.upsert({
      where: key,
      create: { rehearsalId: id, songId, occurrenceDate, status },
      update: { status },
    });
  }
  return NextResponse.json({ songId, status });
});
