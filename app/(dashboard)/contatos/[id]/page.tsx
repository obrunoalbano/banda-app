import { auth } from "@/auth";
import { DeleteLeadButton } from "@/components/DeleteLeadButton";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function ContatoDetalhePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, bandId: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      eventDate: true,
      city: true,
      eventType: true,
      eventDescription: true,
      source: true,
      metadata: true,
      createdAt: true,
    },
  });

  if (!lead) notFound();

  const metadataStr =
    lead.metadata === null || lead.metadata === undefined
      ? null
      : JSON.stringify(lead.metadata, null, 2);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/contatos"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Voltar aos contatos
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{lead.name}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Recebido em{" "}
            {new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "full",
              timeStyle: "short",
              timeZone: "UTC",
            }).format(lead.createdAt)}{" "}
            (UTC)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/contatos/${lead.id}/editar`}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Alterar
          </Link>
          <DeleteLeadButton leadId={lead.id} leadName={lead.name} />
        </div>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{lead.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">WhatsApp</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{lead.whatsapp ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Origem</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{lead.source ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Data do evento</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{lead.eventDate ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cidade</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{lead.city ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tipo de evento</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{lead.eventType ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Descrição do evento</dt>
          <dd className="mt-1 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">{lead.eventDescription ?? "—"}</dd>
        </div>
        {metadataStr ? (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Metadados</dt>
            <dd className="mt-1">
              <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {metadataStr}
              </pre>
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
