import { LeadsIntegrationPanel } from "@/components/LeadsIntegrationPanel";
import { PublicAgendaPanel } from "@/components/PublicAgendaPanel";
import { LeadIcon, ShowIcon, type Icon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { todayDateOnly } from "@/lib/shows";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Integrações" };

function SectionTitle({ id, icon: SectionIcon, title, description }: {
  id: string;
  icon: Icon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 id={id} className="flex items-center gap-2 text-lg font-semibold text-fg">
        <SectionIcon className="size-5 text-fg-subtle" aria-hidden />
        {title}
      </h2>
      <p className="mt-1 text-sm text-fg-muted">{description}</p>
    </div>
  );
}

export default async function IntegracoesPage() {
  const bandId = await requireBandId();
  const [band, publicUpcomingCount, baseUrl] = await Promise.all([
    prisma.band.findUnique({
      where: { id: bandId },
      select: { slug: true, publicAgendaEnabled: true, leadIngestTokenHash: true },
    }),
    prisma.show.count({ where: { bandId, isPublic: true, date: { gte: todayDateOnly() } } }),
    getPublicBaseUrl(),
  ]);
  if (!band) redirect("/login");

  return (
    <div className={containerClass}>
      <PageHeader
        title="Integrações"
        description="Publique sua agenda de shows e receba pedidos de orçamento do seu site."
      />

      <div className="flex flex-col gap-12">
        <section aria-labelledby="integracao-agenda">
          <SectionTitle
            id="integracao-agenda"
            icon={ShowIcon}
            title="Agenda de shows"
            description="Seus shows aparecem automaticamente na página pública, no widget e na API."
          />
          <PublicAgendaPanel
            baseUrl={baseUrl}
            initialSlug={band.slug}
            initialEnabled={band.publicAgendaEnabled}
            publicUpcomingCount={publicUpcomingCount}
          />
        </section>

        <section aria-labelledby="integracao-contatos">
          <SectionTitle
            id="integracao-contatos"
            icon={LeadIcon}
            title="Formulário de contato"
            description="Pedidos de orçamento enviados pelo seu site chegam em Contatos."
          />
          <LeadsIntegrationPanel
            baseUrl={baseUrl}
            ingestPath="/api/leads/ingest"
            initialHasToken={!!band.leadIngestTokenHash}
          />
        </section>
      </div>
    </div>
  );
}
