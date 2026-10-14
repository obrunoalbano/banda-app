/**
 * Normalização de palcos para importação em lote (base da equipe → Stage).
 * Módulo PURO e sem imports com alias: usado pelo script scripts/import-stages.mjs (Node executa
 * TypeScript nativamente) e coberto por lib/stage-import.test.ts.
 */

export type RawVenue = {
  id: string | number;
  name?: string | null;
  type?: string | null;
  state?: string | null;
  city?: string | null;
  lastActivity?: number | string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  verified?: number | boolean | null;
  imageUrl?: string | null;
  created_at?: string | null;
};

export type StageTypeValue =
  | "BAR"
  | "PUB"
  | "CASA_DE_SHOW"
  | "CENTRO_CULTURAL"
  | "RESTAURANTE"
  | "ESPACO_DE_EVENTOS"
  | "TEATRO"
  | "OUTRO";

export type StageImportRow = {
  externalId: string;
  name: string;
  type: StageTypeValue;
  city: string;
  neighborhood: string | null;
  state: string;
  publicPhone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  imageUrl: string | null;
  lastActivityAt: Date | null;
  verified: boolean;
  createdAt: Date | null;
};

const TYPE_MAP: Record<string, StageTypeValue> = {
  bar: "BAR",
  pub: "PUB",
  "casa de shows": "CASA_DE_SHOW",
  "casa de show": "CASA_DE_SHOW",
  "espaço cultural": "CENTRO_CULTURAL",
  "espaco cultural": "CENTRO_CULTURAL",
  "centro cultural": "CENTRO_CULTURAL",
  restaurante: "RESTAURANTE",
  "espaço de eventos": "ESPACO_DE_EVENTOS",
  teatro: "TEATRO",
};

/** Tipo da origem → StageType ("OUTRO" se desconhecido). */
export function mapStageType(raw: string | null | undefined): StageTypeValue {
  return TYPE_MAP[(raw ?? "").trim().toLowerCase()] ?? "OUTRO";
}

/** Espaços extras removidos. */
export function cleanText(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, " ").trim();
}

/**
 * "São Paulo (Freguesia do Ó)" → { city: "São Paulo", neighborhood: "Freguesia do Ó" }.
 * Sem parênteses → bairro null.
 */
export function splitCityNeighborhood(raw: string | null | undefined): { city: string; neighborhood: string | null } {
  const v = cleanText(raw);
  const m = /^(.*?)\s*\((.+)\)\s*$/.exec(v);
  if (!m || !m[1].trim()) return { city: v, neighborhood: null };
  return { city: m[1].trim(), neighborhood: cleanText(m[2]).slice(0, 120) || null };
}

/** Telefone BR → "(11) 99999-0000" / "(11) 3333-0000". Remove DDI 55. Fora do padrão → null. */
export function normalizePhoneBr(raw: string | null | undefined): string | null {
  let d = (raw ?? "").replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return null;
}

/** "casa", "@casa", "instagram.com/casa/?hl=pt" → "@casa". Inválido → null. */
export function normalizeInstagram(raw: string | null | undefined): string | null {
  const v = cleanText(raw);
  if (!v) return null;
  const handle = v
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0]
    .toLowerCase();
  return /^[a-z0-9._]{1,30}$/.test(handle) ? `@${handle}` : null;
}

/** Só https (evita conteúdo misto); inválido → null. */
export function normalizeImageUrl(raw: string | null | undefined): string | null {
  const v = cleanText(raw);
  if (!v) return null;
  try {
    const url = new URL(v);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Última atividade: ano (2025 → 1º/jan/2025 UTC), timestamp em segundos ou ms, ou data em texto.
 * Fora de 1990–2100 → null.
 */
export function parseLastActivity(raw: number | string | null | undefined): Date | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  let date: Date;
  if (Number.isFinite(n)) {
    if (n >= 1990 && n <= 2100) date = new Date(Date.UTC(n, 0, 1));
    else if (n > 1e12) date = new Date(n);
    else if (n > 1e9) date = new Date(n * 1000);
    else return null;
  } else {
    date = new Date(String(raw).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(raw)) ? "" : "Z"));
  }
  const y = date.getUTCFullYear();
  return Number.isNaN(date.getTime()) || y < 1990 || y > 2100 ? null : date;
}

/** "2026-10-07 00:29:33" (UTC) → Date; inválido → null. */
export function parseCreatedAt(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw.trim().replace(" ", "T") + "Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

const UFS = new Set(
  "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" "),
);

export type MapResult = { ok: true; row: StageImportRow } | { ok: false; reason: string };

/** Registro da origem → linha pronta para gravar (ou motivo da rejeição). */
export function toStageImportRow(raw: RawVenue): MapResult {
  const name = cleanText(raw.name).slice(0, 200);
  const { city: cityRaw, neighborhood } = splitCityNeighborhood(raw.city);
  const city = cityRaw.slice(0, 120);
  const state = cleanText(raw.state).toUpperCase();
  if (raw.id === null || raw.id === undefined || String(raw.id).trim() === "") return { ok: false, reason: "sem id" };
  if (!name) return { ok: false, reason: "sem nome" };
  if (!city) return { ok: false, reason: "sem cidade" };
  if (!UFS.has(state)) return { ok: false, reason: "UF inválida" };
  return {
    ok: true,
    row: {
      externalId: String(raw.id).trim(),
      name,
      type: mapStageType(raw.type),
      city,
      neighborhood,
      state,
      publicPhone: normalizePhoneBr(raw.phone),
      whatsapp: normalizePhoneBr(raw.whatsapp),
      instagram: normalizeInstagram(raw.instagram),
      imageUrl: normalizeImageUrl(raw.imageUrl),
      lastActivityAt: parseLastActivity(raw.lastActivity),
      verified: raw.verified === 1 || raw.verified === true,
      createdAt: parseCreatedAt(raw.created_at),
    },
  };
}

/**
 * Chave de duplicidade: mesmo nome + cidade + bairro + UF (sem acento/caixa/espaços).
 * O bairro entra na chave: unidades de uma mesma rede em bairros diferentes são palcos diferentes.
 */
export function dedupeKey(row: Pick<StageImportRow, "name" | "city" | "state"> & { neighborhood?: string | null }): string {
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return `${norm(row.name)}|${norm(row.city)}|${norm(row.neighborhood ?? "")}|${row.state}`;
}
