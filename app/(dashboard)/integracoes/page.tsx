import { auth } from "@/auth";
import { LeadsIntegrationPanel } from "@/components/LeadsIntegrationPanel";
import { getPublicBaseUrl } from "@/lib/public-base-url";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function IntegracoesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bandId = session.user.id;

  const [band, baseUrl] = await Promise.all([
    prisma.band.findUnique({
      where: { id: bandId },
      select: { leadIngestToken: true },
    }),
    getPublicBaseUrl(),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Integrações</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Conecte formulários e sites externos para receber leads na área de{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Contatos</span>.
        </p>
      </div>

      <LeadsIntegrationPanel
        baseUrl={baseUrl}
        ingestPath="/api/leads/ingest"
        initialHasToken={!!band?.leadIngestToken}
      />
    </div>
  );
}
