import type { AttendanceStatus } from "@/app/generated/prisma/enums";
import { AttendanceButtons } from "@/components/rehearsals/AttendanceButtons";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddIcon, RehearsalIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { prisma } from "@/lib/prisma";
import { getMemberId, myNextResponses, upcomingRehearsalWhere } from "@/lib/rehearsal-query";
import { formatOccurrence } from "@/lib/rehearsal-view";
import { nextOccurrence, recurrenceDescription } from "@/lib/rehearsals";
import { requireBandContext } from "@/lib/session";
import { todayDateOnly, toDateOnlyString } from "@/lib/shows";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Ensaios" };

export default async function EnsaiosPage() {
  const { bandId, userId, canEdit } = await requireBandContext();
  const today = todayDateOnly();

  const [rows, past, memberId, activeMembers] = await Promise.all([
    prisma.rehearsal.findMany({
      where: upcomingRehearsalWhere(bandId, today),
      select: {
        id: true,
        name: true,
        location: true,
        date: true,
        time: true,
        recurrence: true,
        recurrenceUntil: true,
        repertoire: { select: { id: true, name: true } },
      },
      take: 100,
    }),
    prisma.rehearsal.findMany({
      where: {
        bandId,
        NOT: upcomingRehearsalWhere(bandId, today),
      },
      orderBy: { date: "desc" },
      take: 10,
      select: { id: true, name: true, location: true, date: true, time: true, recurrence: true },
    }),
    getMemberId(bandId, userId),
    prisma.bandMember.count({ where: { bandId, userId: { not: null } } }),
  ]);

  const upcoming = rows
    .flatMap((r) => {
      const next = nextOccurrence(r, today);
      return next ? [{ ...r, next }] : [];
    })
    .sort((a, b) => a.next.getTime() - b.next.getTime() || a.time.localeCompare(b.time));

  const [mine, confirmed] = await Promise.all([
    memberId ? myNextResponses(memberId, upcoming) : Promise.resolve(new Map<string, AttendanceStatus>()),
    upcoming.length
      ? prisma.rehearsalAttendance.groupBy({
          by: ["rehearsalId"],
          where: { status: "CONFIRMED", OR: upcoming.map((r) => ({ rehearsalId: r.id, occurrenceDate: r.next })) },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);
  const confirmedBy = new Map(confirmed.map((c) => [c.rehearsalId, c._count._all]));
  const pending = memberId ? upcoming.filter((r) => !mine.has(r.id)).length : 0;

  return (
    <div className={containerClass}>
      <PageHeader
        title="Ensaios"
        description="Agenda de ensaios da banda. Cada integrante confirma se vai."
        actions={
          canEdit ? (
            <ButtonLink href="/ensaios/novo" icon={AddIcon}>
              Novo ensaio
            </ButtonLink>
          ) : null
        }
      />

      {pending > 0 ? (
        <div className="mb-6">
          <Alert
            tone="warning"
            title={pending === 1 ? "1 ensaio esperando sua resposta" : `${pending} ensaios esperando sua resposta`}
          >
            Diga se você vai em cada um abaixo.
          </Alert>
        </div>
      ) : null}

      {upcoming.length === 0 ? (
        <EmptyState
          icon={RehearsalIcon}
          title="Nenhum ensaio marcado"
          description="Marque o próximo ensaio: os integrantes recebem um aviso e confirmam presença."
          action={canEdit ? { href: "/ensaios/novo", label: "Marcar ensaio", primary: true } : undefined}
        />
      ) : (
        <Table
          caption="Próximos ensaios"
          headers={[
            { label: "Ensaio" },
            { label: "Próximo" },
            { label: "Local" },
            { label: "Confirmados" },
            { label: "Sua presença", align: "right" },
          ]}
        >
          {upcoming.map((r) => (
            <Tr key={r.id}>
              <Td label="Ensaio" strong>
                <Link href={`/ensaios/${r.id}`} className={linkClass}>
                  {r.name}
                </Link>
                <span className="mt-0.5 block text-xs font-normal text-fg-subtle">
                  {r.recurrence !== "NONE" ? recurrenceDescription(r.recurrence, r.date) : "Ensaio único"}
                  {r.repertoire ? ` · ${r.repertoire.name}` : ""}
                </span>
              </Td>
              <Td label="Próximo">{formatOccurrence(r.next, r.time)}</Td>
              <Td label="Local">{r.location}</Td>
              <Td label="Confirmados" numeric>
                {confirmedBy.get(r.id) ?? 0} de {activeMembers}
              </Td>
              <Td label="Sua presença" align="right">
                {memberId ? (
                  <div className="flex sm:justify-end">
                    <AttendanceButtons
                      rehearsalId={r.id}
                      occurrenceDate={toDateOnlyString(r.next)}
                      current={mine.get(r.id) ?? null}
                      size="sm"
                    />
                  </div>
                ) : (
                  "—"
                )}
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {past.length > 0 ? (
        <section className="mt-10" aria-labelledby="anteriores">
          <h2 id="anteriores" className="mb-3 text-base font-semibold text-fg">
            Anteriores
          </h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface text-sm">
            {past.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                <Link href={`/ensaios/${r.id}`} className={linkClass}>
                  {r.name}
                </Link>
                <span className="text-fg-subtle">
                  {r.recurrence === "NONE" ? formatOccurrence(r.date, r.time) : "Recorrência encerrada"} · {r.location}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
