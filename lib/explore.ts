/**
 * Explorar Palcos (lado da banda): filtros e consulta. Palco → negociação/casa: lib/deals.ts.
 * Puro (sem Prisma em runtime) — coberto por lib/explore.test.ts.
 *
 * REGRA: a banda só vê palcos PUBLISHED. Toda consulta parte de `buildStageWhere`, que fixa isso.
 */
import type { Prisma } from "@/app/generated/prisma/client";
import type { StageType } from "@/app/generated/prisma/enums";

export const EXPLORE_PAGE_SIZE = 24;

const STAGE_TYPES = new Set<string>([
  "BAR",
  "PUB",
  "CASA_DE_SHOW",
  "CENTRO_CULTURAL",
  "RESTAURANTE",
  "ESPACO_DE_EVENTOS",
  "TEATRO",
  "OUTRO",
]);

export type ExploreFilters = {
  uf?: string;
  cidade?: string;
  tipo?: StageType;
  q?: string;
  verificados: boolean;
  whatsapp: boolean;
};

type RawParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

/** Query string → filtros válidos (valores inválidos são ignorados). */
export function parseExploreFilters(sp: RawParams): ExploreFilters {
  const uf = one(sp.uf).toUpperCase();
  const tipo = one(sp.tipo).toUpperCase();
  const q = one(sp.q).slice(0, 80);
  return {
    ...(/^[A-Z]{2}$/.test(uf) && { uf }),
    // Cidade só vale junto com UF (a lista de cidades depende do estado).
    ...(/^[A-Z]{2}$/.test(uf) && one(sp.cidade) && { cidade: one(sp.cidade).slice(0, 120) }),
    ...(STAGE_TYPES.has(tipo) && { tipo: tipo as StageType }),
    ...(q && { q }),
    verificados: one(sp.verificados) === "1",
    whatsapp: one(sp.whatsapp) === "1",
  };
}

/** Filtros → query string (para paginação e links). */
export function exploreFiltersToParams(f: ExploreFilters): Record<string, string> {
  return {
    ...(f.uf && { uf: f.uf }),
    ...(f.cidade && { cidade: f.cidade }),
    ...(f.tipo && { tipo: f.tipo }),
    ...(f.q && { q: f.q }),
    ...(f.verificados && { verificados: "1" }),
    ...(f.whatsapp && { whatsapp: "1" }),
  };
}

/** Consulta de palcos visíveis para bandas — SEMPRE status PUBLISHED. */
export function buildStageWhere(f: ExploreFilters): Prisma.StageWhereInput {
  return {
    status: "PUBLISHED",
    ...(f.uf && { state: f.uf }),
    ...(f.cidade && { city: { equals: f.cidade, mode: "insensitive" } }),
    ...(f.tipo && { type: f.tipo }),
    ...(f.verificados && { verifiedAt: { not: null } }),
    ...(f.whatsapp && { whatsapp: { not: null } }),
    ...(f.q && {
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { neighborhood: { contains: f.q, mode: "insensitive" } },
        { city: { contains: f.q, mode: "insensitive" } },
      ],
    }),
  };
}

/** Ordem: verificados primeiro, depois atividade mais recente, depois nome. */
export const EXPLORE_ORDER_BY: Prisma.StageOrderByWithRelationInput[] = [
  { verifiedAt: { sort: "desc", nulls: "last" } },
  { lastActivityAt: { sort: "desc", nulls: "last" } },
  { name: "asc" },
];

/** Campos do palco que a banda vê (institucionais) — use como `select`. */
export const exploreStageSelect = {
  id: true,
  name: true,
  type: true,
  city: true,
  neighborhood: true,
  state: true,
  genres: true,
  instagram: true,
  website: true,
  whatsapp: true,
  publicPhone: true,
  publicEmail: true,
  imageThumbUrl: true,
  verifiedAt: true,
  lastActivityAt: true,
  notes: true,
} as const;
