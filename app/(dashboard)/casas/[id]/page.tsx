import { auth } from "@/auth";
import { DeleteVenueButton } from "@/components/DeleteVenueButton";
import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

export default async function CasaDetalhePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const venue = await prisma.venue.findFirst({
    where: { id, bandId: session.user.id },
  });

  if (!venue) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/casas"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Voltar à listagem
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {venue.name}
          </h1>
          <div className="mt-2">
            <StatusBadge status={venue.sendStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/casas/${venue.id}/editar`}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Alterar
          </Link>
          <DeleteVenueButton venueId={venue.id} venueName={venue.name} />
        </div>
      </div>

      <dl className="grid max-w-xl gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Responsável</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{venue.responsible}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Telefone</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{venue.phone}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{venue.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cidade</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{venue.city}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Estado</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{venue.state}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Instagram</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {venue.instagram ? (
              <span className="break-all">{venue.instagram}</span>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Valor do cachê</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {venue.valorCache != null ? (
              new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                venue.valorCache,
              )
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </dd>
        </div>
      </dl>
    </div>
  );
}
