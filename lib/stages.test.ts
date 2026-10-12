import { describe, expect, it } from "vitest";
import { needsReverification } from "./stages";
import { stageCreateSchema, stageUpdateSchema } from "./validations";

describe("reverificação", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  it("nunca verificado ou há mais de 180 dias", () => {
    expect(needsReverification(null, now)).toBe(true);
    expect(needsReverification(new Date("2026-03-01T00:00:00Z"), now)).toBe(true);
    expect(needsReverification(new Date("2026-09-01T00:00:00Z"), now)).toBe(false);
  });
});

describe("stageCreateSchema", () => {
  const base = { name: "Bar do Zé", type: "BAR", city: "Santos", state: "sp" };
  it("normaliza UF, estilos e Instagram", () => {
    const r = stageCreateSchema.parse({
      ...base,
      genres: "Rock, POP, rock, ",
      instagram: "https://www.instagram.com/bardoze/",
      publicEmail: "",
    });
    expect(r).toMatchObject({ state: "SP", genres: ["rock", "pop"], instagram: "@bardoze", publicEmail: null });
  });
  it("valida site e capacidade", () => {
    expect(stageCreateSchema.safeParse({ ...base, website: "bardoze.com" }).success).toBe(false);
    expect(stageCreateSchema.safeParse({ ...base, capacity: 0 }).success).toBe(false);
    expect(stageCreateSchema.safeParse({ ...base, type: "BOATE" }).success).toBe(false);
  });
  it("PATCH parcial não apaga campos ausentes (regressão)", () => {
    const r = stageUpdateSchema.parse({ verify: true });
    expect(r).toEqual({ verify: true });
    expect("publicEmail" in r || "instagram" in r).toBe(false);
    expect(stageUpdateSchema.parse({ instagram: "", publicEmail: "" })).toMatchObject({ instagram: null, publicEmail: null });
  });
  it("update aceita só ações de curadoria", () => {
    expect(stageUpdateSchema.parse({ verify: true })).toEqual({ verify: true });
    expect(stageUpdateSchema.parse({ status: "ARCHIVED" })).toEqual({ status: "ARCHIVED" });
  });
});
