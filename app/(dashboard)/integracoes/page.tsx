import { LeadsIntegrationPanel } from "@/components/LeadsIntegrationPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";

export default async function IntegracoesPage() {
  const bandId = await requireBandId();
  const [band, baseUrl] = await Promise.all([
    prisma.band.findUnique({ where: { id: bandId }, select: { leadIngestTokenHash: true } }),
    getPublicBaseUrl(),
  ]);

  return (
    <div className={containerClass}>
      <PageHeader
        title="Integrações"
        description={
          <>
            Conecte formulários e sites externos para receber leads na área de{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Contatos</span>.
          </>
        }
      />
      <LeadsIntegrationPanel
        baseUrl={baseUrl}
        ingestPath="/api/leads/ingest"
        initialHasToken={!!band?.leadIngestTokenHash}
      />
    </div>
  );
}
