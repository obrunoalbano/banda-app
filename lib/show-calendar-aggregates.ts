export type YearMonth = { year: number; month: number };

/** Anos (desc) e meses por ano (asc) a partir dos pares (ano, mês). */
export function groupYearMonths(rows: YearMonth[]): {
  years: number[];
  monthsByYear: Map<number, number[]>;
} {
  const map = new Map<number, Set<number>>();
  for (const { year, month } of rows) {
    if (!map.has(year)) map.set(year, new Set());
    map.get(year)!.add(month);
  }
  const years = [...map.keys()].sort((a, b) => b - a);
  const monthsByYear = new Map<number, number[]>();
  for (const y of years) {
    monthsByYear.set(y, [...map.get(y)!].sort((a, b) => a - b));
  }
  return { years, monthsByYear };
}

export function monthBoundsUtc(year: number, month1to12: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, month1to12 - 1, 1)),
    lt: new Date(Date.UTC(year, month1to12, 1)),
  };
}

export function yearBoundsUtc(year: number): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

export function padMonth(m: number): string {
  return String(m).padStart(2, "0");
}

export function currentYearMonthUtc(): YearMonth {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}
