import { LeadsIntegrationPanel } from "@/components/LeadsIntegrationPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Contatos · Integrações" };

export default async function IntegracaoContatoPage() {
  const bandId = await requireBandId();
  const [band, baseUrl] = await Promise.all([
    prisma.band.findUnique({ where: { id: bandId }, select: { leadIngestTokenHash: true } }),
    getPublicBaseUrl(),
  ]);
  if (!band) redirect("/login");

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Integrações"
        title="Contatos"
        description="Receba pedidos de orçamento do formulário do seu site direto em Contatos."
      />
      <LeadsIntegrationPanel
        baseUrl={baseUrl}
        ingestPath="/api/leads/ingest"
        initialHasToken={!!band.leadIngestTokenHash}
      />
    </div>
  );
}
