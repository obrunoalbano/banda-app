import { RehearsalForm } from "@/components/rehearsals/RehearsalForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandEditor } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo ensaio" };

export default async function NovoEnsaioPage() {
  const { bandId } = await requireBandEditor("/ensaios");
  const repertoires = await prisma.repertoire.findMany({
    where: { bandId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { songs: true } } },
  });
  return (
    <div className={containerClass}>
      <PageHeader title="Novo ensaio" back={{ href: "/ensaios", label: "Voltar à listagem" }} />
      <RehearsalForm
        mode="create"
        repertoires={repertoires.map((r) => ({ id: r.id, name: r.name, songs: r._count.songs }))}
      />
    </div>
  );
}
