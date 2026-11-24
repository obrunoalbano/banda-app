import { AttendanceBadge } from "@/components/rehearsals/AttendanceBadge";
import { AttendanceButtons } from "@/components/rehearsals/AttendanceButtons";
import { SongList } from "@/components/repertoire/SongList";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { DetailItem, DetailList } from "@/components/ui/DetailList";
import { EditIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass, linkClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { getMemberId } from "@/lib/rehearsal-query";
import { formatOccurrence } from "@/lib/rehearsal-view";
import { attendanceCounts, recurrenceDescription, upcomingOccurrences } from "@/lib/rehearsals";
import { formatDateOnly } from "@/lib/format";
import { requireBandContext } from "@/lib/session";
import { todayDateOnly, toDateOnlyString } from "@/lib/shows";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Ensaio" };

type PageProps = { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string }> };

export default async function EnsaioPage({ params, searchParams }: PageProps) {
  const { bandId, userId, canEdit } = await requireBandContext();
  const { id } = await params;
  const created = (await searchParams).criado === "1";
  const today = todayDateOnly();

  const [rehearsal, members, memberId] = await Promise.all([
    prisma.rehearsal.findFirst({
      where: { id, bandId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        date: true,
        time: true,
        recurrence: true,
        recurrenceUntil: true,
        repertoire: {
          select: {
            id: true,
            name: true,
            songs: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                title: true,
                artists: true,
                spotifyUrl: true,
                imageUrl: true,
                durationMs: true,
                notes: true,
              },
            },
          },
        },
      },
    }),
    prisma.bandMember.findMany({
      where: { bandId, userId: { not: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, user: { select: { name: true } } },
    }),
    getMemberId(bandId, userId),
  ]);
  if (!rehearsal) notFound();

  const occurrences = upcomingOccurrences(rehearsal, today, 4);
  const next = occurrences[0] ?? null;
  const responses = next
    ? await prisma.rehearsalAttendance.findMany({
        where: { rehearsalId: rehearsal.id, occurrenceDate: next },
        select: { memberId: true, status: true },
      })
    : [];
  const statusBy = new Map(responses.map((r) => [r.memberId, r.status]));
  const counts = attendanceCounts(
    members.map((m) => m.id),
    responses,
  );
  const recurring = rehearsal.recurrence !== "NONE";

  return (
    <div className={containerClass}>
      <PageHeader
        title={rehearsal.name}
        description={rehearsal.description ?? undefined}
        back={{ href: "/ensaios", label: "Voltar à listagem" }}
        actions={
          canEdit ? (
            <>
              <ButtonLink href={`/ensaios/${rehearsal.id}/editar`} icon={EditIcon}>
                Alterar
              </ButtonLink>
              <ConfirmDeleteButton
                endpoint={`/api/rehearsals/${rehearsal.id}`}
                redirectTo="/ensaios"
                itemLabel={`o ensaio "${rehearsal.name}"${recurring ? " e todas as datas dele" : ""}`}
              />
            </>
          ) : null
        }
      >
        {!next ? <Badge>Já aconteceu</Badge> : recurring ? <Badge tone="info">Recorrente</Badge> : null}
      </PageHeader>

      {created ? (
        <div className="mb-6 max-w-2xl">
          <Alert tone="success" title="Ensaio criado">
            Avisamos os integrantes por email. As respostas aparecem aqui conforme cada um confirma.
          </Alert>
        </div>
      ) : null}

      <DetailList>
        <DetailItem label={next ? "Próximo ensaio" : "Quando"} wide>
          {formatOccurrence(next ?? rehearsal.date, rehearsal.time)}
        </DetailItem>
        <DetailItem label="Local" wide>
          {rehearsal.location}
        </DetailItem>
        <DetailItem label="Repetição">
          {recurrenceDescription(rehearsal.recurrence, rehearsal.date)}
          {recurring && rehearsal.recurrenceUntil ? ` até ${formatDateOnly(rehearsal.recurrenceUntil)}` : ""}
        </DetailItem>
        <DetailItem label="Repertório">
          {rehearsal.repertoire ? (
            <Link href={`/repertorios/${rehearsal.repertoire.id}`} className={linkClass}>
              {rehearsal.repertoire.name}
            </Link>
          ) : (
            "Sem repertório"
          )}
        </DetailItem>
      </DetailList>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card
          title="Presença"
          description={next ? `No ensaio de ${formatOccurrence(next, rehearsal.time)}.` : "Este ensaio já aconteceu."}
        >
          {next ? (
            <div className="flex flex-col gap-4">
              {memberId ? (
                <div>
                  <p className="mb-2 text-sm font-medium text-fg">Você vai?</p>
                  <AttendanceButtons
                    rehearsalId={rehearsal.id}
                    occurrenceDate={toDateOnlyString(next)}
                    current={statusBy.get(memberId) ?? null}
                  />
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">
                  {counts.CONFIRMED} {counts.CONFIRMED === 1 ? "confirmado" : "confirmados"}
                </Badge>
                <Badge tone="danger">
                  {counts.DECLINED} {counts.DECLINED === 1 ? "não vai" : "não vão"}
                </Badge>
                <Badge tone="warning">{counts.PENDING} sem resposta</Badge>
              </div>
              <ul className="divide-y divide-line text-sm">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate">
                      {m.user?.name ?? m.name}
                      {m.id === memberId ? <span className="text-fg-subtle"> (você)</span> : null}
                    </span>
                    <AttendanceBadge status={statusBy.get(m.id)} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        {recurring && occurrences.length > 1 ? (
          <Card title="Próximas datas" description="Cada data tem sua própria confirmação.">
            <ul className="flex flex-col gap-1 text-sm">
              {occurrences.map((d) => (
                <li key={d.toISOString()} className="tabular">
                  {formatOccurrence(d, rehearsal.time)}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>

      {rehearsal.repertoire ? (
        <section className="mt-8" aria-labelledby="repertorio">
          <h2 id="repertorio" className="mb-3 text-base font-semibold text-fg">
            Repertório: {rehearsal.repertoire.name}
          </h2>
          <SongList songs={rehearsal.repertoire.songs} />
        </section>
      ) : null}
    </div>
  );
}
