import { ShowPaymentBadge } from "@/components/ShowPaymentBadge";
import { ShowsFilterForm } from "@/components/ShowsFilterForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { AddIcon, ShowIcon } from "@/components/ui/icons";
import { containerClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { formatDateOnly, monthLabel } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import {
  currentYearMonthUtc,
  groupYearMonths,
  monthBoundsUtc,
  padMonth,
  yearBoundsUtc,
  type YearMonth,
} from "@/lib/show-calendar-aggregates";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Shows" };

type PageProps = {
  searchParams: Promise<{ casaId?: string; ano?: string; mes?: string; pagina?: string }>;
};

function parseMesQuery(raw: string | undefined): number | null {
  if (typeof raw !== "string") return null;
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 12) return null;
  return n;
}

/** Pares (ano, mês) distintos — agregado no banco em vez de trazer todas as datas. */
function fetchShowYearMonths(bandId: string) {
  return prisma.$queryRaw<YearMonth[]>`
    SELECT DISTINCT
      EXTRACT(YEAR FROM "date")::int AS "year",
      EXTRACT(MONTH FROM "date")::int AS "month"
    FROM "Show"
    WHERE "bandId" = ${bandId}
  `;
}

export default async function ShowsPage({ searchParams }: PageProps) {
  const bandId = await requireBandId();
  const sp = await searchParams;
  const casaIdFilter = typeof sp.casaId === "string" ? sp.casaId.trim() : "";
  const anoRaw = typeof sp.ano === "string" ? sp.ano.trim() : "";
  const anoNum = /^\d{4}$/.test(anoRaw) ? Number.parseInt(anoRaw, 10) : null;
  const mesNum = parseMesQuery(sp.mes);
  const page = parsePage(sp.pagina);

  const [venues, yearMonths] = await Promise.all([
    prisma.venue.findMany({
      where: { bandId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    fetchShowYearMonths(bandId),
  ]);

  const { years, monthsByYear } = groupYearMonths(yearMonths);
  const hasShows = years.length > 0;

  const effectiveAno = anoNum !== null && years.includes(anoNum) ? anoNum : null;
  const effectiveMes =
    effectiveAno !== null && mesNum !== null && (monthsByYear.get(effectiveAno)?.includes(mesNum) ?? false)
      ? mesNum
      : null;

  const yearOptions = [
    { value: "", label: "Todos os anos" },
    ...years.map((y) => ({ value: String(y), label: String(y) })),
  ];
  const monthOptions = [
    { value: "", label: "Todos os meses" },
    ...(effectiveAno === null ? [] : (monthsByYear.get(effectiveAno) ?? [])).map((m) => ({
      value: padMonth(m),
      label: monthLabel(m),
    })),
  ];

  const dateWhere =
    effectiveAno === null
      ? undefined
      : effectiveMes !== null
        ? monthBoundsUtc(effectiveAno, effectiveMes)
        : yearBoundsUtc(effectiveAno);

  const now = currentYearMonthUtc();
  const shortcutParams = new URLSearchParams({
    ...(casaIdFilter && { casaId: casaIdFilter }),
    ano: String(now.year),
    mes: padMonth(now.month),
  });

  const where = {
    bandId,
    ...(casaIdFilter ? { venueId: casaIdFilter } : {}),
    ...(dateWhere ? { date: dateWhere } : {}),
  };
  const [filteredTotal, shows] = hasShows
    ? await Promise.all([
        prisma.show.count({ where }),
        prisma.show.findMany({
          where,
          select: {
            id: true,
            date: true,
            time: true,
            cacheCents: true,
            paymentStatus: true,
            cancelledAt: true,
            privateCity: true,
            privateState: true,
            venue: { select: { name: true, city: true, state: true } },
          },
          orderBy: [{ date: "desc" }, { time: "desc" }],
          ...pageArgs(page),
        }),
      ])
    : [0, []];

  const defaultAno = effectiveAno !== null ? String(effectiveAno) : "";
  const defaultMes = effectiveMes !== null ? padMonth(effectiveMes) : "";
  const filterParams: Record<string, string> = {
    ...(casaIdFilter && { casaId: casaIdFilter }),
    ...(defaultAno && { ano: defaultAno }),
    ...(defaultMes && { mes: defaultMes }),
  };

  return (
    <div className={containerClass}>
      <PageHeader
        title="Shows"
        description="Por padrão lista todos os shows. Ano e mês listam só períodos com cadastro."
        actions={
          <ButtonLink href="/shows/nova" icon={AddIcon}>
            Novo show
          </ButtonLink>
        }
      />

      {hasShows && (
        <ShowsFilterForm
          key={`${casaIdFilter}-${defaultAno}-${defaultMes}`}
          venues={venues}
          yearOptions={yearOptions}
          monthOptions={monthOptions}
          defaultVenueId={casaIdFilter}
          defaultAno={defaultAno}
          defaultMes={defaultMes}
          mesShortcutHref={`/shows?${shortcutParams.toString()}`}
        />
      )}

      {!hasShows ? (
        <EmptyState
          icon={ShowIcon}
          title="Nenhum show cadastrado"
          description="Registre seus shows em casas ou eventos particulares para controlar cachê e pagamento."
          action={{ href: "/shows/nova", label: "Cadastrar o primeiro show", primary: true }}
        />
      ) : shows.length === 0 ? (
        <EmptyState
          title="Nenhum show corresponde aos filtros"
          action={{ href: "/shows", label: "Limpar filtros" }}
        />
      ) : (
        <>
          <Table
            caption="Shows cadastrados"
            headers={[
              { label: "Casa" },
              { label: "Cidade" },
              { label: "UF" },
              { label: "Cachê" },
              { label: "Data" },
              { label: "Horário" },
              { label: "Pagamento" },
              { label: "Ações", align: "right" },
            ]}
          >
            {shows.map((show) => (
              <Tr key={show.id}>
                <Td label="Casa" strong>
                  <Link href={`/shows/${show.id}`} className="hover:underline">
                    {show.venue?.name ?? "Evento Particular"}
                  </Link>
                  {show.cancelledAt ? (
                    <span className="ml-2 align-middle">
                      <Badge tone="danger">Cancelado</Badge>
                    </span>
                  ) : null}
                </Td>
                <Td label="Cidade">{show.venue?.city ?? show.privateCity}</Td>
                <Td label="UF">{show.venue?.state ?? show.privateState}</Td>
                <Td label="Cachê" numeric>
                  {formatCents(show.cacheCents)}
                </Td>
                <Td label="Data" numeric>
                  {formatDateOnly(show.date)}
                </Td>
                <Td label="Horário" numeric>
                  {show.time}
                </Td>
                <Td label="Pagamento">
                  <ShowPaymentBadge status={show.paymentStatus} />
                </Td>
                <Td label="Ações" align="right">
                  <Link href={`/shows/${show.id}`} className={linkClass}>
                    Detalhes
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} total={filteredTotal} basePath="/shows" searchParams={filterParams} />
        </>
      )}
    </div>
  );
}
