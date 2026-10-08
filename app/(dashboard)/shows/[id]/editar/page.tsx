import { ShowForm } from "@/components/ShowForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { toDateOnlyString } from "@/lib/shows";
import { notFound } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditarShowPage({ params }: PageProps) {
  const bandId = await requireBandId();
  const { id } = await params;
  const [show, venues] = await Promise.all([
    prisma.show.findFirst({
      where: { id, bandId },
      select: {
        id: true,
        venueId: true,
        date: true,
        time: true,
        privateEventDetails: true,
        privateCity: true,
        privateState: true,
        cacheCents: true,
        paymentStatus: true,
      },
    }),
    prisma.venue.findMany({
      where: { bandId },
      select: { id: true, name: true, city: true, state: true, valorCacheCents: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!show) notFound();

  return (
    <div className={containerClass}>
      <PageHeader title="Alterar show" back={{ href: `/shows/${show.id}`, label: "Voltar aos detalhes" }} />
      <ShowForm mode="edit" venues={venues} show={{ ...show, date: toDateOnlyString(show.date) }} />
    </div>
  );
}
