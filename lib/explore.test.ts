import { describe, expect, it } from "vitest";
import { buildStageWhere, exploreFiltersToParams, parseExploreFilters } from "./explore";

describe("filtros do Explorar", () => {
  it("lê e valida a query string", () => {
    expect(parseExploreFilters({ uf: "sp", cidade: " Santos ", tipo: "bar", q: " rock ", verificados: "1" })).toEqual({
      uf: "SP",
      cidade: "Santos",
      tipo: "BAR",
      q: "rock",
      verificados: true,
      whatsapp: false,
    });
  });
  it("ignora inválidos; cidade só com UF", () => {
    expect(parseExploreFilters({ uf: "São Paulo", cidade: "Santos", tipo: "BOATE" })).toEqual({
      verificados: false,
      whatsapp: false,
    });
  });
  it("ida e volta para a URL", () => {
    const f = parseExploreFilters({ uf: "RJ", whatsapp: "1" });
    expect(exploreFiltersToParams(f)).toEqual({ uf: "RJ", whatsapp: "1" });
  });
});

describe("buildStageWhere", () => {
  it("SEMPRE restringe a publicados", () => {
    expect(buildStageWhere(parseExploreFilters({}))).toEqual({ status: "PUBLISHED" });
    expect(buildStageWhere(parseExploreFilters({ uf: "SP", verificados: "1" }))).toMatchObject({
      status: "PUBLISHED",
      state: "SP",
      verifiedAt: { not: null },
    });
  });
  it("busca em nome, bairro e cidade", () => {
    const w = buildStageWhere(parseExploreFilters({ q: "lapa" }));
    expect(w.OR).toHaveLength(3);
  });
});
