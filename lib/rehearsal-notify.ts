import type { RehearsalRecurrence } from "@/app/generated/prisma/enums";
import { sendEmailResult } from "@/lib/email";
import { formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { recurrenceDescription, rehearsalInviteEmail, weekdayName } from "@/lib/rehearsals";

/**
 * Avisa os integrantes (com conta, menos quem criou) de um ensaio novo e pede confirmação.
 * Roda depois da resposta (`after()` na rota): falha de email não desfaz o ensaio — no app o
 * aviso também aparece (selo "Ensaios" no menu e botões de confirmar na lista).
 */
export async function notifyRehearsalCreated({
  rehearsal,
  bandId,
  creatorUserId,
  baseUrl,
}: {
  rehearsal: {
    id: string;
    name: string;
    location: string;
    date: Date;
    time: string;
    recurrence: RehearsalRecurrence;
  };
  bandId: string;
  creatorUserId: string;
  baseUrl: string | null;
}): Promise<{ sent: number; failed: number }> {
  if (!baseUrl) {
    console.error("[ensaio] base URL ausente — integrantes não avisados por email.");
    return { sent: 0, failed: 0 };
  }
  const [band, members] = await Promise.all([
    prisma.band.findUnique({ where: { id: bandId }, select: { name: true } }),
    prisma.bandMember.findMany({
      where: { bandId, userId: { not: null }, NOT: { userId: creatorUserId }, user: { disabledAt: null } },
      select: { user: { select: { email: true } } },
    }),
  ]);
  const email = rehearsalInviteEmail({
    bandName: band?.name ?? "",
    rehearsalName: rehearsal.name,
    when: `${weekdayName(rehearsal.date)}, ${formatDateOnly(rehearsal.date)} às ${rehearsal.time}`,
    location: rehearsal.location,
    recurrence: rehearsal.recurrence === "NONE" ? "" : recurrenceDescription(rehearsal.recurrence, rehearsal.date),
    url: `${baseUrl}/ensaios/${rehearsal.id}`,
  });
  const results = await Promise.all(
    members.flatMap((m) => (m.user ? [sendEmailResult({ to: m.user.email, ...email })] : [])),
  );
  const failed = results.filter((r) => !r.ok).length;
  if (failed) console.error(`[ensaio] ${failed} de ${results.length} emails não enviados (ensaio ${rehearsal.id}).`);
  return { sent: results.length - failed, failed };
}
