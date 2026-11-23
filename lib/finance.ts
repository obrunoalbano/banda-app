import type { FinanceCategory, FinanceEntryType, ShowPaymentStatus } from "@/app/generated/prisma/enums";
import { FINANCE_CATEGORY_LABELS, FINANCE_TYPE_LABELS } from "./finance-categories";

/**
 * Regras do módulo Financeiro (funções puras — com teste).
 *
 * Receitas = cachês dos shows (Show.cacheCents, sem duplicar em lançamento) + lançamentos de receita.
 * Despesas = lançamentos de despesa. Show cancelado não entra em nenhum total.
 * Totais do período por competência: data do show / data do lançamento.
 * Vencimento do cachê: `paymentDueDate` ou, se vazio, a data do show. Todas as datas são puras (UTC 00:00).
 */

export type ShowMoney = {
  cacheCents: number | null;
  paymentStatus: ShowPaymentStatus;
  date: Date;
  paymentDueDate: Date | null;
  cancelledAt: Date | null;
};

export type EntryMoney = {
  type: FinanceEntryType;
  amountCents: number;
  date: Date;
  paidAt: Date | null;
};

export type FinanceSummary = {
  /** Cachês + receitas avulsas. */
  incomeCents: number;
  receivedCents: number;
  receivableCents: number;
  /** Parte de `receivableCents` já vencida. */
  overdueCents: number;
  expenseCents: number;
  expensePendingCents: number;
  /** incomeCents − expenseCents. */
  resultCents: number;
};

export function showDueDate(show: Pick<ShowMoney, "date" | "paymentDueDate">): Date {
  return show.paymentDueDate ?? show.date;
}

/** Cachê que conta nos totais (show cancelado ou sem cachê = 0). */
export function showIncomeCents(show: Pick<ShowMoney, "cacheCents" | "cancelledAt">): number {
  return show.cancelledAt ? 0 : (show.cacheCents ?? 0);
}

export function isShowOverdue(show: ShowMoney, today: Date): boolean {
  return (
    show.paymentStatus === "AGUARDANDO_PAGAMENTO" &&
    showIncomeCents(show) > 0 &&
    showDueDate(show).getTime() < today.getTime()
  );
}

export function isEntryOverdue(entry: EntryMoney, today: Date): boolean {
  return entry.paidAt === null && entry.date.getTime() < today.getTime();
}

export type EntryStatus = "PAGO" | "PENDENTE" | "ATRASADO";

export function entryStatus(entry: EntryMoney, today: Date): EntryStatus {
  if (entry.paidAt) return "PAGO";
  return isEntryOverdue(entry, today) ? "ATRASADO" : "PENDENTE";
}

export function summarizeFinance({
  shows,
  entries,
  today,
}: {
  shows: ShowMoney[];
  entries: EntryMoney[];
  today: Date;
}): FinanceSummary {
  const s: FinanceSummary = {
    incomeCents: 0,
    receivedCents: 0,
    receivableCents: 0,
    overdueCents: 0,
    expenseCents: 0,
    expensePendingCents: 0,
    resultCents: 0,
  };
  for (const show of shows) {
    const cents = showIncomeCents(show);
    if (cents === 0) continue;
    s.incomeCents += cents;
    if (show.paymentStatus === "PAGO") {
      s.receivedCents += cents;
    } else {
      s.receivableCents += cents;
      if (isShowOverdue(show, today)) s.overdueCents += cents;
    }
  }
  for (const entry of entries) {
    if (entry.type === "RECEITA") {
      s.incomeCents += entry.amountCents;
      if (entry.paidAt) {
        s.receivedCents += entry.amountCents;
      } else {
        s.receivableCents += entry.amountCents;
        if (isEntryOverdue(entry, today)) s.overdueCents += entry.amountCents;
      }
    } else {
      s.expenseCents += entry.amountCents;
      if (!entry.paidAt) s.expensePendingCents += entry.amountCents;
    }
  }
  s.resultCents = s.incomeCents - s.expenseCents;
  return s;
}

/** Resultado de um show: cachê + receitas ligadas − despesas ligadas. */
export function showResultCents(show: Pick<ShowMoney, "cacheCents" | "cancelledAt">, entries: EntryMoney[]): number {
  return entries.reduce(
    (total, e) => total + (e.type === "RECEITA" ? e.amountCents : -e.amountCents),
    showIncomeCents(show),
  );
}

/** Despesas do período somadas por categoria (maior primeiro). */
export function expensesByCategory(
  entries: (EntryMoney & { category: FinanceCategory })[],
): { category: FinanceCategory; cents: number }[] {
  const totals = new Map<FinanceCategory, number>();
  for (const e of entries) {
    if (e.type !== "DESPESA") continue;
    totals.set(e.category, (totals.get(e.category) ?? 0) + e.amountCents);
  }
  return [...totals].map(([category, cents]) => ({ category, cents })).sort((a, b) => b.cents - a.cents);
}

/* ── Exportação CSV ─────────────────────────────────────────────────── */

export type FinanceCsvRow = {
  date: Date;
  type: FinanceEntryType;
  category: FinanceCategory | "CACHE";
  description: string;
  amountCents: number;
  paidAt: Date | null;
  dueDate: Date | null;
};

const CSV_HEADER = ["Data", "Tipo", "Categoria", "Descrição", "Valor (R$)", "Vencimento", "Pago em"];

/** Data pura → "DD/MM/AAAA". */
function csvDate(date: Date | null): string {
  if (!date) return "";
  const [y, m, d] = date.toISOString().slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Centavos → "1500,00" / "-80,50" (vírgula decimal, sem milhar: abre direto no Excel pt-BR). */
function csvAmount(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

function csvCell(value: string): string {
  // Evita fórmula no Excel/Sheets (=, +, -, @) em texto livre.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV com ";" (padrão do Excel em pt-BR) e BOM UTF-8. Despesas saem com valor negativo. */
export function financeCsv(rows: FinanceCsvRow[]): string {
  const lines = [CSV_HEADER.join(";")];
  for (const r of rows) {
    lines.push(
      [
        csvDate(r.date),
        FINANCE_TYPE_LABELS[r.type],
        r.category === "CACHE" ? "Cachê de show" : FINANCE_CATEGORY_LABELS[r.category],
        csvCell(r.description),
        csvAmount(r.type === "DESPESA" ? -r.amountCents : r.amountCents),
        csvDate(r.dueDate),
        csvDate(r.paidAt),
      ].join(";"),
    );
  }
  return `﻿${lines.join("\r\n")}\r\n`;
}

/* ── Período (filtro ano/mês das telas do Financeiro) ───────────────── */

export type FinancePeriod = {
  year: number;
  /** `null` = ano inteiro. */
  month: number | null;
  gte: Date;
  lt: Date;
};

/**
 * `?ano=2026&mes=11` → mês; `?ano=2026` (mês vazio) → ano inteiro; sem `ano` ou inválido → mês de `today`.
 */
export function parseFinancePeriod(params: { ano?: string; mes?: string }, today: Date): FinancePeriod {
  const ano = params.ano?.trim() ?? "";
  const year = /^\d{4}$/.test(ano) ? Number(ano) : null;
  if (year === null || year < 2000 || year > 2100) {
    const y = today.getUTCFullYear();
    const m = today.getUTCMonth() + 1;
    return { year: y, month: m, ...monthRange(y, m) };
  }
  const mes = Number.parseInt(params.mes?.trim() ?? "", 10);
  if (Number.isInteger(mes) && mes >= 1 && mes <= 12) return { year, month: mes, ...monthRange(year, mes) };
  return { year, month: null, gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) };
}

function monthRange(year: number, month: number) {
  return { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) };
}

/** Parâmetros de URL que reproduzem o período (para links e paginação). */
export function periodParams(period: FinancePeriod): Record<string, string> {
  return {
    ano: String(period.year),
    ...(period.month !== null && { mes: String(period.month).padStart(2, "0") }),
  };
}

/** Data pura somando dias (ex.: "próximos 30 dias"). */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}
