import { NextResponse } from "next/server";
import { jsonError, parseBody, withBand } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getMemberId } from "@/lib/rehearsal-query";
import { isOccurrence } from "@/lib/rehearsals";
import { parseDateOnly, todayDateOnly } from "@/lib/shows";
import { rehearsalAttendanceSchema } from "@/lib/validations";

/**
 * O PRÓPRIO integrante confirma ou recusa uma ocorrência do ensaio (visualizador também).
 * Só datas válidas da série, de hoje em diante; responder de novo troca a resposta.
 */
export const POST = withBand<{ id: string }>(
  async (request, { bandId, userId, params: { id } }) => {
    const parsed = await parseBody(request, rehearsalAttendanceSchema);
    if (!parsed.ok) return parsed.response;
    const occurrenceDate = parseDateOnly(parsed.data.occurrenceDate);
    if (!occurrenceDate) return jsonError(400, "Data inválida");

    const [rehearsal, memberId] = await Promise.all([
      prisma.rehearsal.findFirst({
        where: { id, bandId },
        select: { date: true, recurrence: true, recurrenceUntil: true },
      }),
      getMemberId(bandId, userId),
    ]);
    if (!rehearsal) return jsonError(404, "Ensaio não encontrado");
    if (!memberId) return jsonError(403, "Só integrantes da banda respondem presença.");
    if (!isOccurrence(rehearsal, occurrenceDate)) return jsonError(400, "Esta data não faz parte do ensaio.");
    if (occurrenceDate < todayDateOnly()) return jsonError(400, "Este ensaio já passou.");

    const { status } = parsed.data;
    await prisma.rehearsalAttendance.upsert({
      where: { rehearsalId_memberId_occurrenceDate: { rehearsalId: id, memberId, occurrenceDate } },
      create: { rehearsalId: id, memberId, occurrenceDate, status },
      update: { status, respondedAt: new Date() },
    });
    return NextResponse.json({ status });
  },
  { viewer: true },
);
