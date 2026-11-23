import { ButtonLink } from "@/components/ui/Button";
import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import { inputSmClass } from "@/components/ui/styles";
import type { FinancePeriod } from "@/lib/finance";
import { monthLabel } from "@/lib/format";

/** Filtro de período (ano + mês; "Ano inteiro" = mês vazio) das telas do Financeiro. */
export function FinancePeriodFilter({
  basePath,
  period,
  years,
  children,
}: {
  basePath: string;
  period: FinancePeriod;
  /** Anos oferecidos (desc). */
  years: number[];
  /** Campos extras (ex.: tipo e situação em Lançamentos). */
  children?: React.ReactNode;
}) {
  return (
    <FilterBar
      clearHref={basePath}
      extraActions={
        <ButtonLink href={basePath} variant="secondary">
          Mês atual
        </ButtonLink>
      }
    >
      <FilterField id="filtro-ano" label="Ano" minWidth={120}>
        <select id="filtro-ano" name="ano" defaultValue={String(period.year)} className={inputSmClass}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField id="filtro-mes" label="Mês" minWidth={150}>
        <select
          id="filtro-mes"
          name="mes"
          defaultValue={period.month === null ? "" : String(period.month).padStart(2, "0")}
          className={inputSmClass}
        >
          <option value="">Ano inteiro</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={String(m).padStart(2, "0")}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
      </FilterField>
      {children}
    </FilterBar>
  );
}
