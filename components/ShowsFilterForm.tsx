import { ButtonLink } from "@/components/ui/Button";
import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import { inputSmClass } from "@/components/ui/styles";

type SelectOption = { value: string; label: string };

type ShowsFilterFormProps = {
  venues: Array<{ id: string; name: string }>;
  yearOptions: SelectOption[];
  monthOptions: SelectOption[];
  defaultVenueId: string;
  defaultAno: string;
  defaultMes: string;
  /** Link rápido para filtrar ano/mês UTC atual (preserva casa se houver). */
  mesShortcutHref: string;
};

export function ShowsFilterForm({
  venues,
  yearOptions,
  monthOptions,
  defaultVenueId,
  defaultAno,
  defaultMes,
  mesShortcutHref,
}: ShowsFilterFormProps) {
  const mesDisabled = defaultAno === "";

  return (
    <FilterBar
      clearHref="/shows"
      extraActions={
        <ButtonLink href={mesShortcutHref} variant="secondary">
          Mês atual
        </ButtonLink>
      }
    >
      <FilterField id="filtro-casa" label="Casa de show">
        <select id="filtro-casa" name="casaId" defaultValue={defaultVenueId} className={inputSmClass}>
          <option value="">Todas</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField id="filtro-ano" label="Ano" minWidth={140}>
        <select id="filtro-ano" name="ano" defaultValue={defaultAno} className={inputSmClass}>
          {yearOptions.map((o) => (
            <option key={o.value || "todos-ano"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField id="filtro-mes" label={mesDisabled ? "Mês (escolha o ano e aplique)" : "Mês"} minWidth={160}>
        <select
          id="filtro-mes"
          name="mes"
          defaultValue={defaultMes}
          className={inputSmClass}
          disabled={mesDisabled}
        >
          {monthOptions.map((o) => (
            <option key={o.value || "todos-mes"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FilterField>
    </FilterBar>
  );
}
