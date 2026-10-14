import { LeadFormPanel } from "@/components/LeadFormPanel";
import { LeadsIntegrationPanel } from "@/components/LeadsIntegrationPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { formatRelative } from "@/lib/format";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Contatos · Integrações" };

const DAY_MS = 24 * 60 * 60_000;

export default async function IntegracaoContatoPage() {
  const bandId = await requireBandId();
  const now = new Date();
  const [band, lastLead, last30Days, baseUrl] = await Promise.all([
    prisma.band.findUnique({
      where: { id: bandId },
      select: { slug: true, leadFormEnabled: true, leadAllowedOrigins: true, leadIngestTokenHash: true },
    }),
    prisma.lead.findFirst({
      where: { bandId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, source: true },
    }),
    prisma.lead.count({ where: { bandId, createdAt: { gte: new Date(now.getTime() - 30 * DAY_MS) } } }),
    getPublicBaseUrl(),
  ]);
  if (!band) redirect("/login");

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Integrações"
        title="Contatos"
        description="Receba pedidos de orçamento do seu site direto em Contatos."
      />
      <div className="flex flex-col gap-6">
        <LeadFormPanel
          baseUrl={baseUrl}
          slug={band.slug}
          initialEnabled={band.leadFormEnabled}
          initialOrigins={band.leadAllowedOrigins}
          status={{
            lastLeadRelative: lastLead ? formatRelative(lastLead.createdAt, now) : null,
            lastLeadSource: lastLead?.source ?? null,
            last30Days,
          }}
        />
        <LeadsIntegrationPanel
          baseUrl={baseUrl}
          ingestPath="/api/leads/ingest"
          initialHasToken={!!band.leadIngestTokenHash}
        />
      </div>
    </div>
  );
}
