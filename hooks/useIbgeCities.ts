"use client";

import { useEffect, useState } from "react";

/** Cache por UF compartilhado entre formulários (municípios mudam raramente). */
const cache = new Map<string, Promise<string[]>>();

function fetchCities(uf: string): Promise<string[]> {
  let pending = cache.get(uf);
  if (!pending) {
    pending = fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`,
    )
      .then((r) => {
        if (!r.ok) throw new Error(`IBGE ${r.status}`);
        return r.json() as Promise<{ nome: string }[]>;
      })
      .then((data) => data.map((m) => m.nome).sort((a, b) => a.localeCompare(b, "pt-BR")));
    // Falha não fica no cache: permite tentar de novo.
    pending.catch(() => cache.delete(uf));
    cache.set(uf, pending);
  }
  return pending;
}

/**
 * Municípios da UF via API do IBGE.
 * `failed` = a API falhou; o formulário deve permitir digitar a cidade manualmente.
 */
export function useIbgeCities(rawUf: string | null | undefined) {
  const uf = rawUf?.trim().toUpperCase() ?? "";
  const valid = uf.length === 2;
  const [result, setResult] = useState<{ uf: string; cities: string[]; failed: boolean } | null>(
    null,
  );

  useEffect(() => {
    if (!valid) return;
    let active = true;
    fetchCities(uf)
      .then((cities) => active && setResult({ uf, cities, failed: false }))
      .catch(() => active && setResult({ uf, cities: [], failed: true }));
    return () => {
      active = false;
    };
  }, [uf, valid]);

  const current = valid && result?.uf === uf ? result : null;
  return {
    cities: current?.cities ?? [],
    loading: valid && !current,
    failed: current?.failed ?? false,
  };
}
