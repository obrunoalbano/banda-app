import { describe, expect, it } from "vitest";
import {
  dedupeKey,
  mapStageType,
  normalizeImageUrl,
  normalizeInstagram,
  normalizePhoneBr,
  parseLastActivity,
  splitCityNeighborhood,
  toStageImportRow,
} from "./stage-import";

describe("normalização da importação de palcos", () => {
  it("tipos da origem", () => {
    expect(mapStageType("Bar")).toBe("BAR");
    expect(mapStageType("Casa de Shows")).toBe("CASA_DE_SHOW");
    expect(mapStageType("Espaço Cultural")).toBe("CENTRO_CULTURAL");
    expect(mapStageType("Teatro")).toBe("TEATRO");
    expect(mapStageType("Boate")).toBe("OUTRO");
  });
  it.each([
    ["11999990000", "(11) 99999-0000"],
    [" (11) 99999-0000", "(11) 99999-0000"],
    ["1133334444", "(11) 3333-4444"],
    ["+55 11 99999-0000", "(11) 99999-0000"],
    ["5511999990000", "(11) 99999-0000"],
    ["", null],
    ["123", null],
  ])("telefone %s → %s", (raw, expected) => expect(normalizePhoneBr(raw)).toBe(expected));
  it.each([
    ["barDoZe", "@bardoze"],
    ["@bar.do_ze", "@bar.do_ze"],
    ["https://www.instagram.com/barDoZe/?hl=pt-br", "@bardoze"],
    ["", null],
    ["nome com espaço!", null],
  ])("instagram %s → %s", (raw, expected) => expect(normalizeInstagram(raw)).toBe(expected));
  it("imagem só https", () => {
    expect(normalizeImageUrl("https://x.dev/a.webp")).toBe("https://x.dev/a.webp");
    expect(normalizeImageUrl("http://x.dev/a.webp")).toBeNull();
    expect(normalizeImageUrl("lixo")).toBeNull();
  });
  it("última atividade: ano, segundos, ms, texto", () => {
    expect(parseLastActivity(2025)?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
    expect(parseLastActivity(1785507408)?.toISOString()).toBe("2026-07-31T14:16:48.000Z");
    expect(parseLastActivity(1785507408000)?.getUTCFullYear()).toBe(2026);
    expect(parseLastActivity("2026-10-07 00:29:33")?.toISOString()).toBe("2026-10-07T00:29:33.000Z");
    expect(parseLastActivity(null)).toBeNull();
    expect(parseLastActivity(42)).toBeNull();
  });
});

describe("cidade e bairro", () => {
  it.each([
    ["São Paulo (Freguesia do Ó)", "São Paulo", "Freguesia do Ó"],
    ["Brasília(109 Sul / 107 Norte)", "Brasília", "109 Sul / 107 Norte"],
    ["  Santos ", "Santos", null],
    ["(Centro)", "(Centro)", null],
  ])("%s → %s + %s", (raw, city, neighborhood) => {
    expect(splitCityNeighborhood(raw)).toEqual({ city, neighborhood });
  });
});

describe("toStageImportRow", () => {
  const raw = {
    id: 6516,
    name: "  Bar   do Zé ",
    type: "Bar",
    state: "sp",
    city: "Santos ",
    lastActivity: 2025,
    phone: "(13) 3333-4444",
    whatsapp: "13999990000",
    instagram: "bardoze",
    verified: 1,
    imageUrl: "https://img.test/a.webp",
    created_at: "2026-10-07 00:29:33",
  };
  it("mapeia todos os campos", () => {
    const r = toStageImportRow(raw);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.row).toMatchObject({
      externalId: "6516",
      name: "Bar do Zé",
      type: "BAR",
      city: "Santos",
      state: "SP",
      publicPhone: "(13) 3333-4444",
      whatsapp: "(13) 99999-0000",
      instagram: "@bardoze",
      verified: true,
    });
    expect(r.row.createdAt?.toISOString()).toBe("2026-10-07T00:29:33.000Z");
  });
  it("rejeita sem nome, sem cidade ou UF inválida", () => {
    expect(toStageImportRow({ ...raw, name: " " })).toEqual({ ok: false, reason: "sem nome" });
    expect(toStageImportRow({ ...raw, city: "" })).toEqual({ ok: false, reason: "sem cidade" });
    expect(toStageImportRow({ ...raw, state: "XX" })).toEqual({ ok: false, reason: "UF inválida" });
  });
  it("mesma rede em bairros diferentes não é duplicado", () => {
    expect(dedupeKey({ name: "Bar X", city: "São Paulo", neighborhood: "Pinheiros", state: "SP" })).not.toBe(
      dedupeKey({ name: "Bar X", city: "São Paulo", neighborhood: "Vila Madalena", state: "SP" }),
    );
  });
  it("duplicidade ignora acento, caixa e pontuação", () => {
    expect(dedupeKey({ name: "Bar do Zé!", city: "São Paulo", state: "SP" })).toBe(
      dedupeKey({ name: "bar  do ze", city: "Sao Paulo", state: "SP" }),
    );
  });
});
