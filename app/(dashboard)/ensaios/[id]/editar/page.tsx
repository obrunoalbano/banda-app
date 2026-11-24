import { RehearsalForm } from "@/components/rehearsals/RehearsalForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandEditor } from "@/lib/session";
import { toDateOnlyString } from "@/lib/shows";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Alterar ensaio" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarEnsaioPage({ params }: PageProps) {
  const { id } = await params;
  const { bandId } = await requireBandEditor(`/ensaios/${id}`);
  const [rehearsal, repertoires] = await Promise.all([
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
        repertoireId: true,
      },
    }),
    prisma.repertoire.findMany({
      where: { bandId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { songs: true } } },
    }),
  ]);
  if (!rehearsal) notFound();

  return (
    <div className={containerClass}>
      <PageHeader
        title="Alterar ensaio"
        description="Mudou o dia? As novas datas aparecem sem resposta para os integrantes confirmarem de novo."
        back={{ href: `/ensaios/${id}`, label: "Voltar ao ensaio" }}
      />
      <RehearsalForm
        mode="edit"
        rehearsal={{
          ...rehearsal,
          date: toDateOnlyString(rehearsal.date),
          recurrenceUntil: rehearsal.recurrenceUntil ? toDateOnlyString(rehearsal.recurrenceUntil) : null,
        }}
        repertoires={repertoires.map((r) => ({ id: r.id, name: r.name, songs: r._count.songs }))}
      />
    </div>
  );
}
