import { describe, expect, it } from "vitest";
import {
  leadIngestSchema,
  normalizeLeadIngestBody,
  registerBandSchema,
  showCreateSchema,
  venueCreateSchema,
} from "./validations";

describe("registerBandSchema", () => {
  it("normaliza email e faz trim", () => {
    const r = registerBandSchema.parse({
      name: " Banda ",
      responsible: "Ana",
      phone: "11",
      email: " Ana@Exemplo.COM ",
      password: "12345678",
    });
    expect(r.email).toBe("ana@exemplo.com");
    expect(r.name).toBe("Banda");
  });
  it("rejeita senha curta e nome só com espaços", () => {
    const r = registerBandSchema.safeParse({ name: "  ", responsible: "a", phone: "1", email: "a@b.co", password: "123" });
    expect(r.success).toBe(false);
  });
});

describe("venueCreateSchema", () => {
  const base = { name: "Bar", responsible: "Zé", phone: "11", city: "Santos", state: "sp" };
  it("UF em maiúscula, email opcional, instagram vazio vira null", () => {
    const r = venueCreateSchema.parse({ ...base, email: "", instagram: "  " });
    expect(r.state).toBe("SP");
    expect(r.email).toBe("");
    expect(r.instagram).toBeNull();
  });
  it("cachê precisa ser inteiro em centavos", () => {
    expect(venueCreateSchema.safeParse({ ...base, valorCacheCents: 10.5 }).success).toBe(false);
    expect(venueCreateSchema.safeParse({ ...base, valorCacheCents: -1 }).success).toBe(false);
    expect(venueCreateSchema.safeParse({ ...base, valorCacheCents: 150000 }).success).toBe(true);
  });
  it("rejeita UF inválida", () => {
    expect(venueCreateSchema.safeParse({ ...base, state: "São Paulo" }).success).toBe(false);
  });
});

describe("showCreateSchema", () => {
  const base = { date: "2026-12-15", time: "21:00" };
  it("evento particular exige cidade e UF", () => {
    const r = showCreateSchema.safeParse({ ...base, venueId: null });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.map((i) => i.path[0])).toEqual(["privateCity", "privateState"]);
    }
  });
  it("show em casa não exige cidade", () => {
    expect(showCreateSchema.safeParse({ ...base, venueId: "abc" }).success).toBe(true);
  });
  it("venueId vazio conta como evento particular", () => {
    expect(showCreateSchema.safeParse({ ...base, venueId: "", privateCity: "X", privateState: "SP" }).success).toBe(true);
  });
  it("horário inválido", () => {
    expect(showCreateSchema.safeParse({ ...base, venueId: "abc", time: "25:00" }).success).toBe(false);
  });
});

describe("ingestão de leads (contrato externo)", () => {
  it("aceita aliases legados phone/message", () => {
    const r = leadIngestSchema.parse(
      normalizeLeadIngestBody({ name: "Maria", email: "M@X.COM", phone: 11999, message: "Oi" }),
    );
    expect(r).toMatchObject({ email: "m@x.com", whatsapp: "11999", eventDescription: "Oi" });
  });
  it("campos novos têm prioridade sobre os aliases", () => {
    const r = leadIngestSchema.parse(
      normalizeLeadIngestBody({ name: "M", email: "m@x.com", whatsapp: "1", phone: "2" }),
    );
    expect(r.whatsapp).toBe("1");
  });
  it("string vazia vira null", () => {
    expect(leadIngestSchema.parse({ name: "M", email: "m@x.com", city: "" }).city).toBeNull();
  });
});
