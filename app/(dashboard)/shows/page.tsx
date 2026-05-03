import { auth } from "@/auth";
import { ShowPaymentBadge } from "@/components/ShowPaymentBadge";
import { ShowsFilterForm } from "@/components/ShowsFilterForm";
import {
  aggregateShowCalendar,
  capitalize,
  currentYearMonthUtc,
  monthBoundsUtc,
  monthNamePtBr,
  padMonth,
  yearBoundsUtc,
} from "@/lib/show-calendar-aggregates";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ casaId?: string; ano?: string; mes?: string }>;
};

function formatBrl(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function parseMesQuery(raw: string | undefined): number | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  if (t === "") return null;
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return n;
}

export default async function ShowsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bandId = session.user.id;
  const sp = await searchParams;
  const casaIdFilter = typeof sp.casaId === "string" ? sp.casaId.trim() : "";
  const anoRaw = typeof sp.ano === "string" ? sp.ano.trim() : "";
  const mesRaw = typeof sp.mes === "string" ? sp.mes.trim() : "";

  const anoNum =
    anoRaw !== "" && /^\d{4}$/.test(anoRaw) ? Number.parseInt(anoRaw, 10) : null;
  const mesNum = parseMesQuery(mesRaw);

  const [venues, showDatesRows, totalShows] = await Promise.all([
    prisma.venue.findMany({
      where: { bandId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.show.findMany({
      where: { bandId },
      select: { date: true },
    }),
    prisma.show.count({ where: { bandId } }),
  ]);

  const { years, monthsByYear } = aggregateShowCalendar(showDatesRows.map((r) => r.date));

  const effectiveAno =
    anoNum !== null && years.includes(anoNum) ? anoNum : null;
  const effectiveMes =
    effectiveAno !== null &&
    mesNum !== null &&
    (monthsByYear.get(effectiveAno)?.includes(mesNum) ?? false)
      ? mesNum
      : null;

  const yearOptions = [
    { value: "", label: "Todos os anos" },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];

  const monthOptions =
    effectiveAno === null
      ? [{ value: "", label: "Todos os meses" }]
      : [
          { value: "", label: "Todos os meses" },
          ...(monthsByYear.get(effectiveAno) ?? []).map((m) => ({
            value: padMonth(m),
            label: capitalize(monthNamePtBr(m)),
          })),
        ];

  let dateWhere: { gte: Date; lt: Date } | undefined;
  if (effectiveAno !== null) {
    if (effectiveMes !== null) {
      dateWhere = monthBoundsUtc(effectiveAno, effectiveMes);
    } else {
      dateWhere = yearBoundsUtc(effectiveAno);
    }
  }

  const shortcutYm = currentYearMonthUtc();
  const shortcutParams = new URLSearchParams();
  if (casaIdFilter) shortcutParams.set("casaId", casaIdFilter);
  shortcutParams.set("ano", String(shortcutYm.year));
  shortcutParams.set("mes", padMonth(shortcutYm.month));
  const mesShortcutHref = `/shows?${shortcutParams.toString()}`;

  const shows = await prisma.show.findMany({
    where: {
      bandId,
      ...(casaIdFilter ? { venueId: casaIdFilter } : {}),
      ...(dateWhere ? { date: dateWhere } : {}),
    },
    include: {
      venue: { select: { id: true, name: true, city: true, state: true, valorCache: true } },
    },
    orderBy: [{ date: "desc" }, { time: "desc" }],
  });

  const defaultAno = effectiveAno !== null ? String(effectiveAno) : "";
  const defaultMes = effectiveMes !== null ? padMonth(effectiveMes) : "";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Shows</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Por padrão lista todos os shows. Ano e mês listam só períodos com cadastro.
          </p>
        </div>
        <Link
          href="/shows/nova"
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Novo show
        </Link>
      </div>

      {totalShows > 0 && (
        <ShowsFilterForm
          key={`${casaIdFilter}-${defaultAno}-${defaultMes}`}
          venues={venues}
          yearOptions={yearOptions}
          monthOptions={monthOptions}
          defaultVenueId={casaIdFilter}
          defaultAno={defaultAno}
          defaultMes={defaultMes}
          mesShortcutHref={mesShortcutHref}
        />
      )}

      {totalShows === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Nenhum show cadastrado.{" "}
          <Link href="/shows/nova" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Cadastrar o primeiro
          </Link>
        </p>
      ) : shows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Nenhum show corresponde aos filtros.{" "}
          <Link href="/shows" className="font-medium text-zinc-900 underline dark:text-zinc-100">
            Limpar filtros
          </Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Casa</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Cidade</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">UF</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Cachê</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Data</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Horário</th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">Pagamento</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {shows.map((show) => (
                <tr key={show.id} className="bg-white dark:bg-zinc-950">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {show.venue?.name ?? "Evento Particular"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {show.venue?.city ?? show.privateCity ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {show.venue?.state ?? show.privateState ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {formatBrl(show.venue?.valorCache ?? show.privateValorCache)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(show.date)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{show.time}</td>
                  <td className="px-4 py-3">
                    <ShowPaymentBadge status={show.paymentStatus} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/shows/${show.id}`}
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
