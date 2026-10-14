import { PublicAgendaPanel } from "@/components/PublicAgendaPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { todayDateOnly } from "@/lib/shows";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Agenda · Integrações" };

export default async function IntegracaoAgendaPage() {
  const bandId = await requireBandId();
  const [band, publicUpcomingCount, baseUrl] = await Promise.all([
    prisma.band.findUnique({ where: { id: bandId }, select: { slug: true, publicAgendaEnabled: true } }),
    prisma.show.count({ where: { bandId, isPublic: true, date: { gte: todayDateOnly() } } }),
    getPublicBaseUrl(),
  ]);
  if (!band) redirect("/login");

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Integrações"
        title="Agenda"
        description="Publique seus shows numa página pública, num widget para o seu site ou via API. Tudo se atualiza sozinho."
      />
      <PublicAgendaPanel
        baseUrl={baseUrl}
        initialSlug={band.slug}
        initialEnabled={band.publicAgendaEnabled}
        publicUpcomingCount={publicUpcomingCount}
      />
    </div>
  );
}
