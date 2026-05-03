import { VenueSendStatus } from "@/app/generated/prisma/enums";
import { auth } from "@/auth";
import { CasasFilterForm } from "@/components/CasasFilterForm";
import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

const STATUS_VALUES = new Set<string>(Object.values(VenueSendStatus));

function parseStatusFilter(raw: string | undefined): VenueSendStatus | undefined {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s || !STATUS_VALUES.has(s)) return undefined;
  return s as VenueSendStatus;
}

type PageProps = { searchParams: Promise<{ cidade?: string; status?: string }> };

export default async function CasasPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const sp = await searchParams;
  const cidadeFilter = typeof sp.cidade === "string" ? sp.cidade.trim() : "";
  const statusFilter = parseStatusFilter(sp.status);

  const bandId = session.user.id;

  const [cityRows, totalBandVenues, venues] = await Promise.all([
    prisma.venue.findMany({
      where: { bandId },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
    prisma.venue.count({ where: { bandId } }),
    prisma.venue.findMany({
      where: {
        bandId,
        ...(cidadeFilter ? { city: cidadeFilter } : {}),
        ...(statusFilter ? { sendStatus: statusFilter } : {}),
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const cities = cityRows.map((r) => r.city);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Casas de show
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Listagem com status de envio, detalhes e edição.
          </p>
        </div>
        <Link
          href="/casas/nova"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Nova casa
        </Link>
      </div>

      {totalBandVenues > 0 && (
        <CasasFilterForm
          cities={cities}
          defaultCidade={cidadeFilter}
          defaultStatus={statusFilter ?? ""}
        />
      )}

      {totalBandVenues === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Nenhuma casa cadastrada.{" "}
          <Link href="/casas/nova" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Cadastrar a primeira
          </Link>
        </p>
      ) : venues.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Nenhuma casa corresponde aos filtros.{" "}
          <Link href="/casas" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Limpar filtros
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Nome</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Cidade</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">UF</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Cachê</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Status</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {venues.map((v) => (
                <tr key={v.id} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{v.name}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{v.city}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{v.state}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {v.valorCache != null
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(v.valorCache)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={v.sendStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/casas/${v.id}`}
                      className="font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-100"
                    >
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
