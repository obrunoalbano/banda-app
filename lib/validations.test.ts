import { describe, expect, it } from "vitest";
import {
  leadIngestSchema,
  leadFormSettingsSchema,
  normalizeLeadIngestBody,
  publicAgendaSchema,
  publicLeadSchema,
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


describe("campos públicos do show", () => {
  const base = { date: "2026-12-15", time: "21:00", venueId: "v1" };
  it("ticketUrl precisa ser http(s); vazio vira null", () => {
    expect(showCreateSchema.safeParse({ ...base, ticketUrl: "ingressos.com" }).success).toBe(false);
    expect(showCreateSchema.safeParse({ ...base, ticketUrl: "javascript:alert(1)" }).success).toBe(false);
    const ok = showCreateSchema.parse({ ...base, ticketUrl: "https://sympla.com.br/evento" });
    expect(ok.ticketUrl).toBe("https://sympla.com.br/evento");
    expect(showCreateSchema.parse({ ...base, ticketUrl: "" }).ticketUrl).toBeNull();
  });
});

describe("publicAgendaSchema", () => {
  it("normaliza e valida o slug", () => {
    expect(publicAgendaSchema.parse({ slug: "  Os-Incriveis " }).slug).toBe("os-incriveis");
    expect(publicAgendaSchema.safeParse({ slug: "api" }).success).toBe(false);
    expect(publicAgendaSchema.safeParse({ slug: "os incriveis" }).success).toBe(false);
  });
});

describe("formulário público", () => {
  it("normaliza e deduplica domínios; ignora linhas vazias", () => {
    const r = leadFormSettingsSchema.parse({ allowedOrigins: ["meusite.com.br", "https://meusite.com.br/contato", " ", "www.meusite.com.br"] });
    expect(r.allowedOrigins).toEqual(["https://meusite.com.br", "https://www.meusite.com.br"]);
  });
  it("rejeita domínio inválido e mais de 10", () => {
    expect(leadFormSettingsSchema.safeParse({ allowedOrigins: ["meusite"] }).success).toBe(false);
    expect(leadFormSettingsSchema.safeParse({ allowedOrigins: Array.from({ length: 11 }, (_, i) => `s${i}.com`) }).success).toBe(false);
  });
  it("envio público não aceita metadata e mantém honeypot/token", () => {
    const r = publicLeadSchema.parse({ name: "Ana", email: "A@X.COM", website: "", formToken: "t", metadata: { x: 1 } });
    expect(r).toMatchObject({ email: "a@x.com", website: "", formToken: "t" });
    expect("metadata" in r).toBe(false);
  });
});
