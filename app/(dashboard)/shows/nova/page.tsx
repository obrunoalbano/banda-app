import { ShowForm } from "@/components/ShowForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";

export default async function NovoShowPage() {
  const bandId = await requireBandId();
  const venues = await prisma.venue.findMany({
    where: { bandId },
    select: { id: true, name: true, city: true, state: true, valorCacheCents: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className={containerClass}>
      <PageHeader title="Novo show" back={{ href: "/shows", label: "Voltar à listagem" }} />
      <ShowForm mode="create" venues={venues} />
    </div>
  );
}
