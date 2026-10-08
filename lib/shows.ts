/**
 * Regras de domínio de Show compartilhadas entre criação (POST) e edição (PATCH).
 *
 * Um show é em uma casa (`venueId`) OU um evento particular (sem casa, com cidade/UF).
 * Quando há casa, os campos `private*` são sempre gravados como `null`.
 */

/** "YYYY-MM-DD" → Date em UTC 00:00 (data pura). `null` se inválida. */
export function parseDateOnly(value: string): Date | null {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (Number.isNaN(date.getTime())) return null;
  // Rejeita datas que o Date "corrige" (ex.: 2026-02-31 → 03/03).
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return date;
}

/** Date (UTC 00:00) → "YYYY-MM-DD" para inputs `type="date"`. */
export function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Campos do show já normalizados, prontos para gravar. */
export type ShowWriteFields = {
  venueId: string | null;
  privateEventDetails: string | null;
  privateCity: string | null;
  privateState: string | null;
};

type ShowLocationInput = {
  venueId?: string | null;
  privateEventDetails?: string | null;
  privateCity?: string | null;
  privateState?: string | null;
};

/**
 * Resolve local do show mesclando o input (parcial no PATCH) com o estado atual.
 * `undefined` = manter o valor atual; `null`/"" = limpar.
 */
export function resolveShowLocation(
  input: ShowLocationInput,
  current: ShowWriteFields = {
    venueId: null,
    privateEventDetails: null,
    privateCity: null,
    privateState: null,
  },
): ShowWriteFields {
  const venueId = pick(input.venueId, current.venueId, (v) => v.trim() || null);
  if (venueId) {
    return { venueId, privateEventDetails: null, privateCity: null, privateState: null };
  }
  return {
    venueId: null,
    privateEventDetails: pick(input.privateEventDetails, current.privateEventDetails, (v) => v.trim() || null),
    privateCity: pick(input.privateCity, current.privateCity, (v) => v.trim() || null),
    privateState: pick(input.privateState, current.privateState, (v) => v.trim().toUpperCase() || null),
  };
}

function pick(
  next: string | null | undefined,
  current: string | null,
  normalize: (v: string) => string | null,
): string | null {
  if (next === undefined) return current;
  if (next === null) return null;
  return normalize(next);
}

/**
 * Cachê do show (snapshot em centavos).
 * - informado no input → usa o informado (inclusive `null`);
 * - não informado e casa nova/alterada → copia o cachê atual da casa;
 * - não informado e casa mantida → mantém o valor atual.
 */
export function resolveShowCache({
  inputCents,
  currentCents,
  venueChanged,
  venueCacheCents,
}: {
  inputCents: number | null | undefined;
  currentCents: number | null;
  venueChanged: boolean;
  venueCacheCents: number | null | undefined;
}): number | null {
  if (inputCents !== undefined) return inputCents;
  if (venueChanged && venueCacheCents !== undefined) return venueCacheCents;
  return currentCents;
}
