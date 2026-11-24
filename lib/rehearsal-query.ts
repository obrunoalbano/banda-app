import { cache } from "react";
import type { AttendanceStatus, RehearsalRecurrence } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { nextOccurrence } from "@/lib/rehearsals";

/** Consultas de ensaios (servidor). Regras puras em lib/rehearsals.ts. */

type RuleRow = { id: string; date: Date; recurrence: RehearsalRecurrence; recurrenceUntil: Date | null };

/** Ensaios que ainda podem ter ocorrência futura (único a partir de hoje ou recorrente não encerrado). */
export function upcomingRehearsalWhere(bandId: string, today: Date) {
  return {
    bandId,
    OR: [
      { recurrence: "NONE" as const, date: { gte: today } },
      { recurrence: { not: "NONE" as const }, OR: [{ recurrenceUntil: null }, { recurrenceUntil: { gte: today } }] },
    ],
  };
}

/** Integrante da banda ativa do usuário (só quem já tem conta responde presença). */
export const getMemberId = cache(async (bandId: string, userId: string): Promise<string | null> => {
  const member = await prisma.bandMember.findFirst({ where: { bandId, userId }, select: { id: true } });
  return member?.id ?? null;
});

/**
 * Respostas do integrante para a PRÓXIMA ocorrência de cada ensaio (mapa rehearsalId → status).
 * Ensaio sem entrada no mapa = ainda não respondeu.
 */
export async function myNextResponses(
  memberId: string,
  rehearsals: { id: string; next: Date }[],
): Promise<Map<string, AttendanceStatus>> {
  if (rehearsals.length === 0) return new Map();
  const rows = await prisma.rehearsalAttendance.findMany({
    where: {
      memberId,
      OR: rehearsals.map((r) => ({ rehearsalId: r.id, occurrenceDate: r.next })),
    },
    select: { rehearsalId: true, status: true },
  });
  return new Map(rows.map((r) => [r.rehearsalId, r.status]));
}

/** Quantos ensaios (próxima ocorrência) o usuário ainda não respondeu — selo no menu. */
export const pendingRehearsalCount = cache(async (bandId: string, userId: string, today: Date): Promise<number> => {
  const memberId = await getMemberId(bandId, userId);
  if (!memberId) return 0;
  const rows: RuleRow[] = await prisma.rehearsal.findMany({
    where: upcomingRehearsalWhere(bandId, today),
    select: { id: true, date: true, recurrence: true, recurrenceUntil: true },
    take: 100,
  });
  const upcoming = rows.flatMap((r) => {
    const next = nextOccurrence(r, today);
    return next ? [{ id: r.id, next }] : [];
  });
  const answered = await myNextResponses(memberId, upcoming);
  return upcoming.filter((r) => !answered.has(r.id)).length;
});
