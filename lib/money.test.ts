import { describe, expect, it } from "vitest";
import { centsFromDigits, formatCents, formatCentsPlain, MAX_CENTS } from "./money";

// Intl usa NBSP entre "R$" e o número.
const norm = (s: string) => s.replace(/ /g, " ");

describe("formatCents", () => {
  it("formata centavos em BRL", () => {
    expect(norm(formatCents(150050))).toBe("R$ 1.500,50");
    expect(norm(formatCents(0))).toBe("R$ 0,00");
  });
  it("vazio vira travessão", () => {
    expect(formatCents(null)).toBe("—");
    expect(formatCents(undefined)).toBe("—");
    expect(formatCents(Number.NaN)).toBe("—");
  });
});

describe("máscara de moeda", () => {
  it("dígitos digitados viram centavos", () => {
    expect(centsFromDigits("1")).toBe(1);
    expect(centsFromDigits("150000")).toBe(150000);
    expect(centsFromDigits("1.500,00")).toBe(150000);
    expect(centsFromDigits("0,05")).toBe(5);
  });
  it("vazio vira null", () => {
    expect(centsFromDigits("")).toBeNull();
    expect(centsFromDigits("abc")).toBeNull();
  });
  it("respeita o teto do INTEGER do Postgres", () => {
    expect(centsFromDigits("99999999999999")).toBe(MAX_CENTS);
    expect(MAX_CENTS).toBeLessThanOrEqual(2_147_483_647);
  });
  it("ida e volta é estável", () => {
    expect(formatCentsPlain(150050)).toBe("1.500,50");
    expect(centsFromDigits(formatCentsPlain(150050))).toBe(150050);
    expect(formatCentsPlain(null)).toBe("");
  });
});
