import { FinancePeriodFilter } from "@/components/FinancePeriodFilter";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AddIcon, DownloadIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Stat } from "@/components/ui/Stat";
import { containerClass, linkClass } from "@/components/ui/styles";
import { Table, Td, Tr } from "@/components/ui/Table";
import { FINANCE_CATEGORY_LABELS } from "@/lib/finance-categories";
import {
  addDays,
  expensesByCategory,
  parseFinancePeriod,
  periodParams,
  showDueDate,
  showIncomeCents,
  summarizeFinance,
  type FinancePeriod,
} from "@/lib/finance";
import { entryMoneySelect, fetchPeriodMoney, financeYears, showLabel, showMoneySelect } from "@/lib/finance-query";
import { formatDateOnly, monthLabel } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireBandContext } from "@/lib/session";
import { todayDateOnly } from "@/lib/shows";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Financeiro" };

type PageProps = { searchParams: Promise<{ ano?: string; mes?: string }> };

const UPCOMING_DAYS = 30;
const LIST_LIMIT = 10;

/** Item de recebimento (cachê de show ou receita avulsa) nas listas "Atrasados" e "Próximos". */
type ReceivableRow = {
  key: string;
  label: string;
  href: string;
  due: Date;
  cents: number;
  isShow: boolean;
};

function periodLabel(period: FinancePeriod): string {
  return period.month === null ? `Ano de ${period.year}` : `${monthLabel(period.month)} de ${period.year}`;
}

/** Cachês e receitas não pagos com vencimento em [from, to) — `from` vazio = qualquer data passada. */
async function fetchReceivables(bandId: string, range: { gte?: Date; lt: Date }): Promise<ReceivableRow[]> {
  const [shows, entries] = await Promise.all([
    prisma.show.findMany({
      where: {
        bandId,
        paymentStatus: "AGUARDANDO_PAGAMENTO",
        cancelledAt: null,
        cacheCents: { gt: 0 },
        OR: [{ paymentDueDate: range }, { paymentDueDate: null, date: range }],
      },
      select: showMoneySelect,
      orderBy: { date: "asc" },
      take: LIST_LIMIT,
    }),
    prisma.financeEntry.findMany({
      where: { bandId, type: "RECEITA", paidAt: null, date: range },
      select: entryMoneySelect,
      orderBy: { date: "asc" },
      take: LIST_LIMIT,
    }),
  ]);
  return [
    ...shows.map((s) => ({
      key: `show-${s.id}`,
      label: showLabel(s),
      href: `/shows/${s.id}`,
      due: showDueDate(s),
      cents: showIncomeCents(s),
      isShow: true,
    })),
    ...entries.map((e) => ({
      key: `entry-${e.id}`,
      label: e.description,
      href: `/financeiro/lancamentos/${e.id}/editar`,
      due: e.date,
      cents: e.amountCents,
      isShow: false,
    })),
  ]
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, LIST_LIMIT);
}

function ReceivableTable({ caption, rows, empty }: { caption: string; rows: ReceivableRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-fg-muted">{empty}</p>;
  return (
    <Table
      caption={caption}
      headers={[{ label: "Descrição" }, { label: "Origem" }, { label: "Vencimento" }, { label: "Valor" }]}
    >
      {rows.map((r) => (
        <Tr key={r.key}>
          <Td label="Descrição" strong>
            <Link href={r.href} className="hover:underline">
              {r.label}
            </Link>
          </Td>
          <Td label="Origem">{r.isShow ? "Cachê de show" : "Lançamento"}</Td>
          <Td label="Vencimento" numeric>
            {formatDateOnly(r.due)}
          </Td>
          <Td label="Valor" numeric>
            {formatCents(r.cents)}
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const { bandId, canEdit } = await requireBandContext();
  const today = todayDateOnly();
  const period = parseFinancePeriod(await searchParams, today);

  const [years, [shows, entries], overdue, upcoming] = await Promise.all([
    financeYears(bandId, today.getUTCFullYear()),
    fetchPeriodMoney(bandId, period),
    fetchReceivables(bandId, { lt: today }),
    fetchReceivables(bandId, { gte: today, lt: addDays(today, UPCOMING_DAYS) }),
  ]);

  const summary = summarizeFinance({ shows, entries, today });
  const cacheCents = shows.reduce((total, s) => total + showIncomeCents(s), 0);
  const byCategory = expensesByCategory(entries);
  const exportHref = `/financeiro/exportar?${new URLSearchParams(periodParams(period))}`;

  return (
    <div className={containerClass}>
      <PageHeader
        eyebrow="Financeiro"
        title="Visão geral"
        description={`${periodLabel(period)} · cachês dos shows e lançamentos, pela data do show ou do lançamento.`}
        actions={
          <>
            <ButtonLink href={exportHref} variant="secondary" icon={DownloadIcon} prefetch={false}>
              Exportar CSV
            </ButtonLink>
            {canEdit ? (
              <ButtonLink href="/financeiro/lancamentos/nova" icon={AddIcon}>
                Novo lançamento
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <FinancePeriodFilter basePath="/financeiro" period={period} years={years} />

      <section aria-label="Resumo do período" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label="Receitas"
          value={formatCents(summary.incomeCents)}
          hint={`Cachês ${formatCents(cacheCents)} · outras ${formatCents(summary.incomeCents - cacheCents)}`}
        />
        <Stat label="Recebido" value={formatCents(summary.receivedCents)} />
        <Stat
          label="A receber"
          value={formatCents(summary.receivableCents)}
          hint={summary.overdueCents > 0 ? `${formatCents(summary.overdueCents)} atrasado` : "Nada atrasado"}
        />
        <Stat
          label="Despesas"
          value={formatCents(summary.expenseCents)}
          hint={summary.expensePendingCents > 0 ? `${formatCents(summary.expensePendingCents)} a pagar` : "Tudo pago"}
        />
        <Stat
          label="Resultado"
          value={formatCents(summary.resultCents)}
          hint="Receitas − despesas"
          tone={summary.resultCents < 0 ? "danger" : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </section>

      <div className="mt-8 grid gap-6">
        <Card
          title="Atrasados"
          description="Cachês e receitas vencidos e não recebidos, de qualquer período."
          actions={
            overdue.length > 0 ? (
              <Badge tone="danger">{overdue.length >= LIST_LIMIT ? `${LIST_LIMIT}+` : overdue.length}</Badge>
            ) : null
          }
        >
          <ReceivableTable caption="Recebimentos atrasados" rows={overdue} empty="Nenhum recebimento atrasado." />
        </Card>

        <Card title="Próximos recebimentos" description={`Vencem nos próximos ${UPCOMING_DAYS} dias.`}>
          <ReceivableTable
            caption="Próximos recebimentos"
            rows={upcoming}
            empty={`Nenhum recebimento previsto para os próximos ${UPCOMING_DAYS} dias.`}
          />
        </Card>

        <Card
          title="Despesas por categoria"
          description={periodLabel(period)}
          actions={
            <Link
              href={`/financeiro/lancamentos?${new URLSearchParams({ ...periodParams(period), tipo: "DESPESA" })}`}
              className={linkClass}
            >
              Ver despesas
            </Link>
          }
        >
          {byCategory.length === 0 ? (
            <p className="text-sm text-fg-muted">Nenhuma despesa lançada no período.</p>
          ) : (
            <ul className="divide-y divide-line">
              {byCategory.map(({ category, cents }) => (
                <li key={category} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-fg">{FINANCE_CATEGORY_LABELS[category]}</span>
                  <span className="tabular text-fg-muted">{formatCents(cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
