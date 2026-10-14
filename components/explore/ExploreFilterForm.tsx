"use client";

import { FilterBar, FilterField } from "@/components/ui/FilterBar";
import { inputSmClass } from "@/components/ui/styles";
import { BRAZIL_UFS } from "@/lib/brazil-states";
import type { ExploreFilters } from "@/lib/explore";
import { STAGE_TYPE_OPTIONS } from "@/lib/stages";

/**
 * Filtros do Explorar Palcos (`<form method="get">`). Trocar a UF reenvia o formulário
 * sem cidade: a lista de cidades vem do servidor para o estado escolhido.
 */
export function ExploreFilterForm({ filters, cities }: { filters: ExploreFilters; cities: string[] }) {
  return (
    <FilterBar clearHref="/explorar">
      <FilterField id="explorar-q" label="Buscar" minWidth={200}>
        <input
          id="explorar-q"
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder="Nome, bairro ou cidade"
          maxLength={80}
          className={inputSmClass}
        />
      </FilterField>
      <FilterField id="explorar-uf" label="Estado" minWidth={140}>
        <select
          id="explorar-uf"
          name="uf"
          defaultValue={filters.uf ?? ""}
          className={inputSmClass}
          onChange={(e) => {
            const form = e.currentTarget.form;
            const city = form?.elements.namedItem("cidade");
            if (city instanceof HTMLSelectElement) city.value = "";
            form?.requestSubmit();
          }}
        >
          <option value="">Todos</option>
          {BRAZIL_UFS.map((u) => (
            <option key={u.sigla} value={u.sigla}>
              {u.nome}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField id="explorar-cidade" label="Cidade">
        <select
          id="explorar-cidade"
          name="cidade"
          defaultValue={filters.cidade ?? ""}
          disabled={!filters.uf}
          className={inputSmClass}
        >
          <option value="">{filters.uf ? "Todas" : "Escolha o estado"}</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FilterField>
      <FilterField id="explorar-tipo" label="Tipo" minWidth={160}>
        <select id="explorar-tipo" name="tipo" defaultValue={filters.tipo ?? ""} className={inputSmClass}>
          <option value="">Todos</option>
          {STAGE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FilterField>
      <fieldset className="flex flex-col justify-end gap-1.5 text-sm text-fg">
        <legend className="sr-only">Mostrar só</legend>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="verificados"
            value="1"
            defaultChecked={filters.verificados}
            className="size-4 accent-primary"
          />
          Só verificados
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="whatsapp"
            value="1"
            defaultChecked={filters.whatsapp}
            className="size-4 accent-primary"
          />
          Com WhatsApp
        </label>
      </fieldset>
    </FilterBar>
  );
}
