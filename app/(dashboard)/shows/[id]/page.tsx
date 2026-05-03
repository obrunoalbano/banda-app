import { auth } from "@/auth";
import { DeleteShowButton } from "@/components/DeleteShowButton";
import { ShowPaymentBadge } from "@/components/ShowPaymentBadge";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = { params: Promise<{ id: string }> };

function formatBrl(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function ShowDetalhePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const show = await prisma.show.findFirst({
    where: { id, bandId: session.user.id },
    include: { venue: true },
  });
  if (!show) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/shows"
            className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← Voltar à listagem
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {show.venue?.name ?? "Evento Particular"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(show.date)} às {show.time}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/shows/${show.id}/editar`}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Alterar
          </Link>
          <DeleteShowButton
            showId={show.id}
            showLabel={`${show.venue?.name ?? "Evento Particular"} - ${new Intl.DateTimeFormat("pt-BR", {
              timeZone: "UTC",
            }).format(show.date)}`}
          />
        </div>
      </div>

      <dl className="grid max-w-xl gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Casa de show</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{show.venue?.name ?? "Evento Particular"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cidade</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {show.venue?.city ?? show.privateCity ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Estado</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {show.venue?.state ?? show.privateState ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cachê</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {formatBrl(show.venue?.valorCache ?? show.privateValorCache)}
          </dd>
        </div>
        {show.privateEventDetails && (
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Detalhes do evento particular
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-zinc-900 dark:text-zinc-100">
              {show.privateEventDetails}
            </dd>
          </div>
        )}
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Data</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
            {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(show.date)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Horário</dt>
          <dd className="mt-1 text-zinc-900 dark:text-zinc-100">{show.time}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Status de pagamento
          </dt>
          <dd className="mt-1">
            <ShowPaymentBadge status={show.paymentStatus} />
          </dd>
        </div>
      </dl>
    </div>
  );
}
