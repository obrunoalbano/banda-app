import { describe, expect, it } from "vitest";
import {
  dateParts,
  formatRelative,
  formatDateOnly,
  formatDateTimeShort,
  instagramHref,
  maskPhoneBr,
  monthLabel,
  whatsappHref,
} from "./format";

describe("datas", () => {
  it("data pura (UTC 00:00) não volta um dia", () => {
    expect(formatDateOnly(new Date(Date.UTC(2026, 11, 15)))).toBe("15/12/2026");
  });
  it("timestamp é exibido no fuso de São Paulo", () => {
    // 02:30 UTC = 23:30 do dia anterior em São Paulo (UTC-3)
    expect(formatDateTimeShort(new Date(Date.UTC(2026, 4, 10, 2, 30)))).toBe("09/05/2026, 23:30");
  });
  it("nome do mês capitalizado", () => {
    expect(monthLabel(3)).toBe("Março");
  });
});

describe("maskPhoneBr", () => {
  it.each([
    ["11", "(11"],
    ["1199999", "(11) 9999-9"],
    ["1133334444", "(11) 3333-4444"],
    ["11999990000", "(11) 99999-0000"],
    ["(11) 99999-00001", "(11) 99999-0000"],
    ["", ""],
  ])("%s → %s", (input, expected) => {
    expect(maskPhoneBr(input)).toBe(expected);
  });
  it("mantém número internacional sem máscara", () => {
    expect(maskPhoneBr("+1 555 0100")).toBe("+1 555 0100");
  });
});

describe("links", () => {
  it("whatsapp assume DDI 55", () => {
    expect(whatsappHref("(11) 99999-0000")).toBe("https://wa.me/5511999990000");
    expect(whatsappHref("+55 11 99999-0000")).toBe("https://wa.me/5511999990000");
    expect(whatsappHref("123")).toBeNull();
    expect(whatsappHref(null)).toBeNull();
  });
  it("instagram aceita @, nome ou URL", () => {
    expect(instagramHref("@casa.show")).toBe("https://instagram.com/casa.show");
    expect(instagramHref("instagram.com/casa/")).toBe("https://instagram.com/casa");
    expect(instagramHref("https://instagram.com/x")).toBe("https://instagram.com/x");
    expect(instagramHref("nome com espaço")).toBeNull();
  });
});


describe("dateParts (bloco de data da agenda)", () => {
  it("partes em pt-BR sem ponto final", () => {
    expect(dateParts("2026-12-15")).toEqual({
      day: "15",
      month: "dez",
      weekday: "ter",
      long: "terça-feira, 15 de dezembro de 2026",
    });
  });
});

describe("formatRelative", () => {
  const now = new Date("2026-10-13T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);
  it.each([
    [10_000, "agora há pouco"],
    [5 * 60_000, "há 5 minutos"],
    [3 * 3600_000, "há 3 horas"],
    [26 * 3600_000, "ontem"],
    [3 * 86400_000, "há 3 dias"],
    [65 * 86400_000, "há 2 meses"],
  ])("%sms → %s", (ms, expected) => {
    expect(formatRelative(ago(ms), now)).toBe(expected);
  });
});
