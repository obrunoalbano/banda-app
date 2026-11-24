import { RepertoireForm } from "@/components/repertoire/RepertoireForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandEditor } from "@/lib/session";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Alterar repertório" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarRepertorioPage({ params }: PageProps) {
  const { id } = await params;
  const { bandId } = await requireBandEditor(`/repertorios/${id}`);
  const repertoire = await prisma.repertoire.findFirst({
    where: { id, bandId },
    select: {
      id: true,
      name: true,
      description: true,
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
  });
  if (!repertoire) notFound();

  return (
    <div className={containerClass}>
      <PageHeader title="Alterar repertório" back={{ href: `/repertorios/${id}`, label: "Voltar ao repertório" }} />
      <RepertoireForm mode="edit" repertoire={repertoire} />
    </div>
  );
}
