import { formatDateOnly } from "@/lib/format";
import { prisma } from "@/lib/prisma";

/**
 * Consultas do Financeiro (Server Components e exportação). Sempre filtradas por banda.
 */

/** Anos com shows ou lançamentos + o ano atual (desc) — opções do filtro de período. */
export async function financeYears(bandId: string, currentYear: number): Promise<number[]> {
  const rows = await prisma.$queryRaw<{ year: number }[]>`
    SELECT DISTINCT EXTRACT(YEAR FROM "date")::int AS "year" FROM "Show" WHERE "bandId" = ${bandId}
    UNION
    SELECT DISTINCT EXTRACT(YEAR FROM "date")::int AS "year" FROM "FinanceEntry" WHERE "bandId" = ${bandId}
  `;
  return [...new Set([currentYear, ...rows.map((r) => r.year)])].sort((a, b) => b - a);
}

export const showMoneySelect = {
  id: true,
  date: true,
  cacheCents: true,
  paymentStatus: true,
  paymentDueDate: true,
  paidAt: true,
  cancelledAt: true,
  privateCity: true,
  venue: { select: { name: true } },
} as const;

export const entryMoneySelect = {
  id: true,
  type: true,
  category: true,
  description: true,
  amountCents: true,
  date: true,
  paidAt: true,
  showId: true,
} as const;

/** Shows e lançamentos com data no período [gte, lt). */
export function fetchPeriodMoney(bandId: string, { gte, lt }: { gte: Date; lt: Date }) {
  // Só gte/lt: o período traz outros campos (ano, mês) que o Prisma rejeita.
  const range = { gte, lt };
  return Promise.all([
    prisma.show.findMany({
      where: { bandId, date: range },
      select: showMoneySelect,
      orderBy: { date: "asc" },
    }),
    prisma.financeEntry.findMany({
      where: { bandId, date: range },
      select: entryMoneySelect,
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    }),
  ]);
}

/** Nome exibido do show nas telas financeiras. */
export function showLabel(show: { venue: { name: string } | null; privateCity: string | null }): string {
  return show.venue?.name ?? `Evento particular${show.privateCity ? ` · ${show.privateCity}` : ""}`;
}

/** Shows da banda para o select "Show relacionado" (mais recentes primeiro). */
export async function showOptions(bandId: string): Promise<{ id: string; label: string }[]> {
  const shows = await prisma.show.findMany({
    where: { bandId },
    select: { id: true, date: true, venue: { select: { name: true } }, privateCity: true },
    orderBy: { date: "desc" },
    take: 300,
  });
  return shows.map((s) => ({ id: s.id, label: `${formatDateOnly(s.date)} · ${showLabel(s)}` }));
}
