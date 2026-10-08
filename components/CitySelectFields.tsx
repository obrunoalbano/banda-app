"use client";

import { BRAZIL_UFS } from "@/lib/brazil-states";
import { useIbgeCities } from "@/hooks/useIbgeCities";
import { SelectField, TextField } from "@/components/ui/fields";

/** Par UF + cidade (municípios do IBGE). Se o IBGE falhar, a cidade vira campo de texto. */
export function CitySelectFields({
  state,
  city,
  onChange,
}: {
  state: string;
  city: string;
  onChange: (next: { state: string; city: string }) => void;
}) {
  const { cities, loading, failed } = useIbgeCities(state);

  return (
    <>
      <SelectField
        label="Estado (UF)"
        required
        value={state}
        onChange={(e) => onChange({ state: e.target.value, city: "" })}
      >
        <option value="">Selecione o estado</option>
        {BRAZIL_UFS.map((s) => (
          <option key={s.sigla} value={s.sigla}>
            {s.nome} ({s.sigla})
          </option>
        ))}
      </SelectField>

      {failed ? (
        <TextField
          label="Cidade"
          required
          value={city}
          onChange={(e) => onChange({ state, city: e.target.value })}
          hint="Não foi possível carregar a lista de cidades; digite o nome."
        />
      ) : (
        <SelectField
          label="Cidade"
          required
          value={city}
          onChange={(e) => onChange({ state, city: e.target.value })}
          disabled={!state || loading}
        >
          <option value="">
            {!state ? "Selecione o estado primeiro" : loading ? "Carregando cidades…" : "Selecione a cidade"}
          </option>
          {city && !cities.includes(city) && <option value={city}>{city}</option>}
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </SelectField>
      )}
    </>
  );
}
