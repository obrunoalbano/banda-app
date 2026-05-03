/** Agrega anos (UTC) e meses por ano a partir das datas dos shows. */
export function aggregateShowCalendar(
  dates: Date[],
): { years: number[]; monthsByYear: Map<number, number[]> } {
  const map = new Map<number, Set<number>>();
  for (const d of dates) {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    if (!map.has(y)) map.set(y, new Set());
    map.get(y)!.add(m);
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

export function monthNamePtBr(month1to12: number): string {
  const d = new Date(Date.UTC(2000, month1to12 - 1, 1));
  return new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(d);
}

export function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("pt-BR") + s.slice(1);
}

export function currentYearMonthUtc(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
  };
}
