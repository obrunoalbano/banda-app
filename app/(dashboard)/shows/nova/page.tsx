import { ShowForm } from "@/components/ShowForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandEditor } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo show" };

export default async function NovoShowPage() {
  const { bandId } = await requireBandEditor("/shows");
  const [venues, repertoires] = await Promise.all([
    prisma.venue.findMany({
      where: { bandId },
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        valorCacheCents: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.repertoire.findMany({
      where: { bandId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { songs: true } } },
    }),
  ]);

  return (
    <div className={containerClass}>
      <PageHeader title="Novo show" back={{ href: "/shows", label: "Voltar à listagem" }} />
      <ShowForm
        mode="create"
        venues={venues}
        repertoires={repertoires.map((r) => ({ id: r.id, name: r.name, songs: r._count.songs }))}
      />
    </div>
  );
}
