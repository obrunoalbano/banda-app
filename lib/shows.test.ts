import { describe, expect, it } from "vitest";
import {
  parseDateOnly,
  resolveCancelledAt,
  resolveShowCache,
  resolveShowLocation,
  resolveShowVisibility,
  toDateOnlyString,
  todayDateOnly,
} from "./shows";

describe("parseDateOnly", () => {
  it("gera UTC 00:00", () => {
    expect(parseDateOnly("2026-12-15")?.toISOString()).toBe("2026-12-15T00:00:00.000Z");
  });
  it("rejeita datas inexistentes", () => {
    expect(parseDateOnly("2026-02-31")).toBeNull();
    expect(parseDateOnly("2026-13-01")).toBeNull();
    expect(parseDateOnly("x")).toBeNull();
  });
  it("ida e volta", () => {
    expect(toDateOnlyString(parseDateOnly("2026-01-05")!)).toBe("2026-01-05");
  });
});

describe("resolveShowLocation", () => {
  const privateShow = {
    venueId: null,
    privateEventDetails: "Casamento",
    privateCity: "Campinas",
    privateState: "SP",
  };

  it("show em casa zera os campos de evento particular", () => {
    expect(resolveShowLocation({ venueId: "v1", privateCity: "X", privateState: "rj" })).toEqual({
      venueId: "v1",
      privateEventDetails: null,
      privateCity: null,
      privateState: null,
    });
  });
  it("evento particular normaliza UF e strings vazias", () => {
    expect(
      resolveShowLocation({ venueId: null, privateCity: " Campinas ", privateState: "sp", privateEventDetails: "  " }),
    ).toEqual({ venueId: null, privateEventDetails: null, privateCity: "Campinas", privateState: "SP" });
  });
  it("PATCH parcial mantém os valores atuais", () => {
    expect(resolveShowLocation({}, privateShow)).toEqual(privateShow);
    expect(resolveShowLocation({ privateCity: "Santos" }, privateShow).privateCity).toBe("Santos");
  });
  it("PATCH trocando particular → casa limpa campos privados", () => {
    expect(resolveShowLocation({ venueId: "v2" }, privateShow)).toEqual({
      venueId: "v2",
      privateEventDetails: null,
      privateCity: null,
      privateState: null,
    });
  });
});

describe("resolveShowCache (snapshot)", () => {
  it("valor informado sempre vence", () => {
    expect(resolveShowCache({ inputCents: 500, currentCents: 100, venueChanged: true, venueCacheCents: 900 })).toBe(500);
    expect(resolveShowCache({ inputCents: null, currentCents: 100, venueChanged: false, venueCacheCents: 900 })).toBeNull();
  });
  it("criação sem valor copia o cachê da casa", () => {
    expect(resolveShowCache({ inputCents: undefined, currentCents: null, venueChanged: true, venueCacheCents: 900 })).toBe(900);
  });
  it("edição sem trocar de casa mantém o snapshot", () => {
    expect(resolveShowCache({ inputCents: undefined, currentCents: 100, venueChanged: false, venueCacheCents: 900 })).toBe(100);
  });
  it("virar evento particular sem valor mantém o atual", () => {
    expect(resolveShowCache({ inputCents: undefined, currentCents: 100, venueChanged: true, venueCacheCents: undefined })).toBe(100);
  });
});


describe("resolveShowVisibility (padrão da agenda pública)", () => {
  it("criação: casa pública, particular oculto", () => {
    expect(resolveShowVisibility({ inputIsPublic: undefined, venueId: "v1" })).toBe(true);
    expect(resolveShowVisibility({ inputIsPublic: undefined, venueId: null })).toBe(false);
  });
  it("valor informado vence", () => {
    expect(resolveShowVisibility({ inputIsPublic: true, venueId: null })).toBe(true);
    expect(resolveShowVisibility({ inputIsPublic: false, venueId: "v1" })).toBe(false);
  });
  it("edição: mantém o atual; virar particular oculta por privacidade", () => {
    expect(resolveShowVisibility({ inputIsPublic: undefined, currentIsPublic: false, venueId: "v1" })).toBe(false);
    expect(resolveShowVisibility({ inputIsPublic: undefined, currentIsPublic: true, venueId: null })).toBe(false);
  });
});

describe("resolveCancelledAt", () => {
  const now = new Date("2026-10-12T12:00:00Z");
  const before = new Date("2026-10-01T12:00:00Z");
  it("cancelar marca agora e preserva data anterior", () => {
    expect(resolveCancelledAt(true, null, now)).toEqual(now);
    expect(resolveCancelledAt(true, before, now)).toEqual(before);
  });
  it("reativar limpa; omitido mantém", () => {
    expect(resolveCancelledAt(false, before, now)).toBeNull();
    expect(resolveCancelledAt(undefined, before, now)).toEqual(before);
  });
});

describe("todayDateOnly", () => {
  it("usa o fuso de São Paulo (01:00 UTC ainda é o dia anterior)", () => {
    expect(todayDateOnly(new Date("2026-10-12T01:00:00Z")).toISOString()).toBe("2026-10-11T00:00:00.000Z");
    expect(todayDateOnly(new Date("2026-10-12T15:00:00Z")).toISOString()).toBe("2026-10-12T00:00:00.000Z");
  });
});
