import { describe, expect, it } from "vitest";
import { issueFormToken } from "./lead-form-token";
import { classifyOrigin, defaultLeadSource, spamVerdict } from "./public-lead";

describe("classifyOrigin", () => {
  const app = ["https://app.agenda.com"];
  const allowed = ["https://meusite.com.br"];
  it("formulário do próprio app", () => expect(classifyOrigin("https://app.agenda.com", app, allowed)).toBe("app"));
  it("domínio cadastrado (case-insensitive)", () =>
    expect(classifyOrigin("https://MEUSITE.com.br", app, allowed)).toBe("allowed"));
  it("outro site ou sem origem é negado", () => {
    expect(classifyOrigin("https://spam.com", app, allowed)).toBe("denied");
    expect(classifyOrigin(null, app, allowed)).toBe("denied");
  });
});

describe("spamVerdict", () => {
  const now = 1_800_000_000_000;
  const okToken = issueFormToken("banda", now - 10_000);
  it("honeypot preenchido descarta em silêncio", () => {
    expect(spamVerdict({ honeypot: "http://x", formToken: okToken, originKind: "app", slug: "banda", now })).toBe("drop");
  });
  it("formulário do app exige token", () => {
    expect(spamVerdict({ honeypot: "", formToken: undefined, originKind: "app", slug: "banda", now })).toBe("expired");
    expect(spamVerdict({ honeypot: "", formToken: okToken, originKind: "app", slug: "banda", now })).toBe("accept");
  });
  it("envio rápido demais é descartado", () => {
    const fast = issueFormToken("banda", now - 500);
    expect(spamVerdict({ honeypot: undefined, formToken: fast, originKind: "app", slug: "banda", now })).toBe("drop");
  });
  it("domínio cadastrado não precisa de token", () => {
    expect(spamVerdict({ honeypot: undefined, formToken: undefined, originKind: "allowed", slug: "banda", now })).toBe(
      "accept",
    );
  });
});

describe("defaultLeadSource", () => {
  it("app ou domínio do site", () => {
    expect(defaultLeadSource("app", "https://app.agenda.com")).toBe("formulario-publico");
    expect(defaultLeadSource("allowed", "https://www.meusite.com.br")).toBe("www.meusite.com.br");
  });
});
