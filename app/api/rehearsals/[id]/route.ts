import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { parseDateOnly, parseOptionalDateOnly } from "@/lib/shows";
import { rehearsalUpdateSchema } from "@/lib/validations";

/**
 * Altera o ensaio. As respostas de presença são por data de ocorrência: mudar o dia faz as novas
 * datas aparecerem sem resposta (as antigas ficam no histórico, sem efeito).
 */
export const PATCH = withBand<{ id: string }>(async (request, { bandId, params: { id } }) => {
  const parsed = await parseBody(request, rehearsalUpdateSchema);
  if (!parsed.ok) return parsed.response;
  const { date, recurrenceUntil, repertoireId, ...data } = parsed.data;

  const current = await prisma.rehearsal.findFirst({
    where: { id, bandId },
    select: {
      date: true,
      recurrence: true,
      recurrenceUntil: true,
      repertoireId: true,
    },
  });
  if (!current) return jsonError(404, "Ensaio não encontrado");

  const dateValue = date !== undefined ? parseDateOnly(date) : current.date;
  if (!dateValue) return jsonError(400, "Data inválida");
  const until = parseOptionalDateOnly(recurrenceUntil);
  if (!until.ok) return jsonError(400, "Data final inválida");
  const recurrence = data.recurrence ?? current.recurrence;
  const untilValue = recurrence === "NONE" ? null : until.value === undefined ? current.recurrenceUntil : until.value;
  if (untilValue && untilValue < dateValue) {
    return jsonError(400, "A data final precisa ser depois da data do ensaio");
  }
  if (
    repertoireId &&
    !(await prisma.repertoire.findFirst({
      where: { id: repertoireId, bandId },
      select: { id: true },
    }))
  ) {
    return jsonError(400, "Repertório inválido");
  }

  // Trocou o repertório: a ordem própria e as marcações de ensaiada eram do repertório antigo.
  const repertoireChanged = repertoireId !== undefined && repertoireId !== current.repertoireId;
  await prisma.$transaction([
    prisma.rehearsal.updateMany({
      where: { id, bandId },
      data: {
        ...data,
        date: dateValue,
        recurrenceUntil: untilValue,
        ...(repertoireId !== undefined && { repertoireId }),
        ...(repertoireChanged && { songOrder: [] }),
      },
    }),
    ...(repertoireChanged ? [prisma.rehearsalSongCheck.deleteMany({ where: { rehearsalId: id } })] : []),
  ]);
  return NextResponse.json({ id });
});

export const DELETE = withBand<{ id: string }>(async (_request, { bandId, params: { id } }) => {
  const { count } = await prisma.rehearsal.deleteMany({
    where: { id, bandId },
  });
  if (count === 0) return jsonError(404, "Ensaio não encontrado");
  return NextResponse.json({ id });
});
