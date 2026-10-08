import { VenueForm } from "@/components/VenueForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarCasaPage({ params }: PageProps) {
  const bandId = await requireBandId();
  const { id } = await params;
  const venue = await prisma.venue.findFirst({ where: { id, bandId } });
  if (!venue) notFound();

  return (
    <div className={containerClass}>
      <PageHeader title="Alterar casa" back={{ href: `/casas/${venue.id}`, label: "Voltar aos detalhes" }} />
      <VenueForm mode="edit" venue={venue} />
    </div>
  );
}
