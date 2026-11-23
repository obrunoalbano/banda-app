import type { FinanceEntryType } from "@/app/generated/prisma/enums";
import { FinanceEntryStatusBadge } from "@/components/FinanceEntryStatusBadge";
import { FinancePeriodFilter } from "@/components/FinancePeriodFilter";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterField } from "@/components/ui/FilterBar";
import { AddIcon, DownloadIcon, FinanceEntryIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination, pageArgs, parsePage } from "@/components/ui/Pagination";
import { containerClass, inputSmClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { entryStatus, parseFinancePeriod, periodParams } from "@/lib/finance";
import { FINANCE_CATEGORY_LABELS, FINANCE_TYPE_LABELS, FINANCE_TYPE_OPTIONS } from "@/lib/finance-categories";
import { financeYears, showLabel } from "@/lib/finance-query";
import { formatDateOnly } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireBandId } from "@/lib/session";
import { todayDateOnly } from "@/lib/shows";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Lançamentos" };

type PageProps = {
  searchParams: Promise<{ ano?: string; mes?: string; tipo?: string; situacao?: string; pagina?: string }>;
};

const SITUATIONS = [
  { value: "pendente", label: "Pendentes" },
  { value: "atrasado", label: "Atrasados" },
  { value: "pago", label: "Pagos" },
] as const;
type Situation = (typeof SITUATIONS)[number]["value"];

export default async function LancamentosPage({ searchParams }: PageProps) {
  const bandId = await requireBandId();
  const sp = await searchParams;
  const today = todayDateOnly();
  const period = parseFinancePeriod(sp, today);
  const type = FINANCE_TYPE_OPTIONS.find((o) => o.value === sp.tipo)?.value as FinanceEntryType | undefined;
  const situation = SITUATIONS.find((s) => s.value === sp.situacao)?.value as Situation | undefined;
  const page = parsePage(sp.pagina);

  const situationWhere =
    situation === "pago"
      ? { paidAt: { not: null } }
      : situation === "pendente"
        ? { paidAt: null }
        : situation === "atrasado"
          ? { paidAt: null, date: { gte: period.gte, lt: period.lt < today ? period.lt : today } }
          : {};
  const where = {
    bandId,
    date: { gte: period.gte, lt: period.lt },
    ...(type && { type }),
    ...situationWhere,
  };

  const [years, total, entries, hasAny] = await Promise.all([
    financeYears(bandId, today.getUTCFullYear()),
    prisma.financeEntry.count({ where }),
    prisma.financeEntry.findMany({
      where,
      select: {
        id: true,
        type: true,
        category: true,
        description: true,
        amountCents: true,
        date: true,
        paidAt: true,
        show: { select: { id: true, venue: { select: { name: true } }, privateCity: true } },
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      ...pageArgs(page),
    }),
    prisma.financeEntry.findFirst({ where: { bandId }, select: { id: true } }),
  ]);

  const filterParams: Record<string, string> = {
    ...periodParams(period),
    ...(type && { tipo: type }),
    ...(situation && { situacao: situation }),
  };

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Financeiro"
        title="Lançamentos"
        description="Despesas e receitas além do cachê. Os cachês ficam nos Shows e entram na visão geral."
        actions={
          <>
            <ButtonLink
              href={`/financeiro/exportar?${new URLSearchParams(periodParams(period))}`}
              variant="secondary"
              icon={DownloadIcon}
              prefetch={false}
            >
              Exportar CSV
            </ButtonLink>
            <ButtonLink href="/financeiro/lancamentos/nova" icon={AddIcon}>
              Novo lançamento
            </ButtonLink>
          </>
        }
      />

      {hasAny ? (
        <FinancePeriodFilter basePath="/financeiro/lancamentos" period={period} years={years}>
          <FilterField id="filtro-tipo" label="Tipo" minWidth={140}>
            <select id="filtro-tipo" name="tipo" defaultValue={type ?? ""} className={inputSmClass}>
              <option value="">Todos</option>
              {FINANCE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField id="filtro-situacao" label="Situação" minWidth={140}>
            <select id="filtro-situacao" name="situacao" defaultValue={situation ?? ""} className={inputSmClass}>
              <option value="">Todas</option>
              {SITUATIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </FilterField>
        </FinancePeriodFilter>
      ) : null}

      {!hasAny ? (
        <EmptyState
          icon={FinanceEntryIcon}
          title="Nenhum lançamento ainda"
          description="Registre despesas (transporte, som, freelancer…) e receitas extras (merch, patrocínio) para ver o resultado real da banda."
          action={{ href: "/financeiro/lancamentos/nova", label: "Lançar a primeira despesa", primary: true }}
        />
      ) : entries.length === 0 ? (
        <EmptyState title="Nenhum lançamento corresponde aos filtros" action={{ href: "/financeiro/lancamentos", label: "Limpar filtros" }} />
      ) : (
        <>
          <Table
            caption="Lançamentos financeiros"
            headers={[
              { label: "Descrição" },
              { label: "Categoria" },
              { label: "Show" },
              { label: "Data" },
              { label: "Valor" },
              { label: "Situação" },
              { label: "Ações", align: "right" },
            ]}
          >
            {entries.map((e) => (
              <Tr key={e.id}>
                <Td label="Descrição" strong>
                  <Link href={`/financeiro/lancamentos/${e.id}/editar`} className="hover:underline">
                    {e.description}
                  </Link>
                </Td>
                <Td label="Categoria">
                  {FINANCE_TYPE_LABELS[e.type]} · {FINANCE_CATEGORY_LABELS[e.category]}
                </Td>
                <Td label="Show">
                  {e.show ? (
                    <Link href={`/shows/${e.show.id}`} className={linkClass}>
                      {showLabel(e.show)}
                    </Link>
                  ) : null}
                </Td>
                <Td label="Data" numeric>
                  {formatDateOnly(e.date)}
                </Td>
                <Td label="Valor" numeric>
                  <span className={`whitespace-nowrap ${e.type === "DESPESA" ? "text-danger-fg" : "text-success-fg"}`}>
                    {e.type === "DESPESA" ? "−" : "+"} {formatCents(e.amountCents)}
                  </span>
                </Td>
                <Td label="Situação">
                  <FinanceEntryStatusBadge status={entryStatus(e, today)} />
                </Td>
                <Td label="Ações" align="right">
                  <Link href={`/financeiro/lancamentos/${e.id}/editar`} className={linkClass}>
                    Alterar
                  </Link>
                </Td>
              </Tr>
            ))}
          </Table>
          <Pagination page={page} total={total} basePath="/financeiro/lancamentos" searchParams={filterParams} />
        </>
      )}
    </div>
  );
}
