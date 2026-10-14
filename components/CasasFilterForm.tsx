import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import { inputSmClass } from "@/components/ui/styles";
import { SEND_STATUS_OPTIONS } from "@/lib/send-status";

type CasasFilterFormProps = {
  cities: string[];
  defaultCidade: string;
  defaultStatus: string;
};

export function CasasFilterForm({ cities, defaultCidade, defaultStatus }: CasasFilterFormProps) {
  return (
    <FilterBar clearHref="/casas">
      <FilterField id="filtro-cidade" label="Cidade">
        <select id="filtro-cidade" name="cidade" defaultValue={defaultCidade} className={inputSmClass}>
          <option value="">Todas</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField id="filtro-status" label="Status de envio">
        <select id="filtro-status" name="status" defaultValue={defaultStatus} className={inputSmClass}>
          <option value="">Todos</option>
          {SEND_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FilterField>
    </FilterBar>
  );
}
