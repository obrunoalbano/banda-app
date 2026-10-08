import { describe, expect, it } from "vitest";
import { groupYearMonths, monthBoundsUtc } from "./show-calendar-aggregates";

describe("calendário de shows", () => {
  it("agrupa anos (desc) e meses (asc)", () => {
    const { years, monthsByYear } = groupYearMonths([
      { year: 2025, month: 12 },
      { year: 2026, month: 3 },
      { year: 2026, month: 1 },
    ]);
    expect(years).toEqual([2026, 2025]);
    expect(monthsByYear.get(2026)).toEqual([1, 3]);
  });
  it("limites do mês em UTC (dezembro vira o ano)", () => {
    const { gte, lt } = monthBoundsUtc(2026, 12);
    expect(gte.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(lt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
