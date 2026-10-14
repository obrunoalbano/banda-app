import { ExploreFilterForm } from "@/components/explore/ExploreFilterForm";
import { StageCard } from "@/components/explore/StageCard";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { ExploreIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { containerClass } from "@/components/ui/styles";
import {
  buildStageWhere,
  EXPLORE_ORDER_BY,
  EXPLORE_PAGE_SIZE,
  exploreFiltersToParams,
  exploreStageSelect,
  parseExploreFilters,
} from "@/lib/explore";
import { formatInteger } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { requireBandId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Explorar Palcos" };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ExplorarPage({ searchParams }: PageProps) {
  const bandId = await requireBandId();
  const sp = await searchParams;
  const filters = parseExploreFilters(sp);
  const page = parsePage(sp.pagina);

  const header = (
    <PageHeader
      title="Explorar Palcos"
      description="Bares, casas de show e espaços com música ao vivo. Adicione ao Fluxo de contatos para acompanhar a negociação."
    />
  );

  // A base curada é o ativo do produto: limita varredura (paginação em massa) por banda.
  const limited = rateLimit(`explore:${bandId}`, RATE_LIMITS.explore);
  if (!limited.ok) {
    return (
      <div className={containerClass}>
        {header}
        <Alert>Muitas buscas em pouco tempo. Aguarde alguns minutos e tente de novo.</Alert>
      </div>
    );
  }

  const where = buildStageWhere(filters);
  const [cityRows, total, stages] = await Promise.all([
    filters.uf
      ? prisma.stage.findMany({
          where: { status: "PUBLISHED", state: filters.uf },
          select: { city: true },
          distinct: ["city"],
          orderBy: { city: "asc" },
        })
      : Promise.resolve([]),
    prisma.stage.count({ where }),
    prisma.stage.findMany({
      where,
      select: exploreStageSelect,
      orderBy: EXPLORE_ORDER_BY,
      ...pageArgs(page, EXPLORE_PAGE_SIZE),
    }),
  ]);

  // Quais destes palcos já estão no fluxo da banda ou nas casas (sinalizados no card).
  const stageIds = stages.map((s) => s.id);
  const [deals, venues] = stageIds.length
    ? await Promise.all([
        prisma.deal.findMany({
          where: { bandId, stageId: { in: stageIds } },
          select: { id: true, step: true, stageId: true },
        }),
        prisma.venue.findMany({ where: { bandId, stageId: { in: stageIds } }, select: { id: true, stageId: true } }),
      ])
    : [[], []];
  const dealByStage = new Map(deals.map((d) => [d.stageId, { id: d.id, step: d.step }]));
  const venueByStage = new Map(venues.map((v) => [v.stageId, v.id]));
  const params = exploreFiltersToParams(filters);
  const hasFilters = Object.keys(params).length > 0;

  return (
    <div className={containerClass}>
      {header}
      <ExploreFilterForm filters={filters} cities={cityRows.map((r) => r.city)} />

      {stages.length === 0 ? (
        <EmptyState
          icon={ExploreIcon}
          title={hasFilters ? "Nenhum palco corresponde aos filtros" : "Nenhum palco disponível ainda"}
          description={hasFilters ? "Tente outra cidade ou remova algum filtro." : "A base está sendo montada pela nossa equipe."}
          action={hasFilters ? { href: "/explorar", label: "Limpar filtros" } : undefined}
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-fg-muted" aria-live="polite">
            <span className="tabular font-medium text-fg">{formatInteger(total)}</span>{" "}
            {total === 1 ? "palco encontrado" : "palcos encontrados"}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stages.map((stage) => (
              <li key={stage.id} className="flex">
                <StageCard
                  stage={stage}
                  venueId={venueByStage.get(stage.id) ?? null}
                  deal={dealByStage.get(stage.id) ?? null}
                />
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            total={total}
            pageSize={EXPLORE_PAGE_SIZE}
            basePath="/explorar"
            searchParams={params}
          />
        </>
      )}
    </div>
  );
}
