import { describe, expect, it } from "vitest";
import { FORM_TOKEN_MAX_AGE_MS, issueFormToken, verifyFormToken } from "./lead-form-token";

describe("token de formulário", () => {
  const t0 = 1_800_000_000_000;
  it("válido entre 3s e 24h", () => {
    const token = issueFormToken("os-incriveis", t0);
    expect(verifyFormToken(token, "os-incriveis", t0 + 5_000)).toBe("ok");
  });
  it("rápido demais (robô)", () => {
    expect(verifyFormToken(issueFormToken("os-incriveis", t0), "os-incriveis", t0 + 1_000)).toBe("too-fast");
  });
  it("expirado", () => {
    const token = issueFormToken("os-incriveis", t0);
    expect(verifyFormToken(token, "os-incriveis", t0 + FORM_TOKEN_MAX_AGE_MS + 1)).toBe("expired");
  });
  it("de outra banda ou adulterado", () => {
    const token = issueFormToken("os-incriveis", t0);
    expect(verifyFormToken(token, "outra-banda", t0 + 5_000)).toBe("invalid");
    const [slug, , sig] = token.split(".");
    expect(verifyFormToken(`${slug}.${t0 - 60_000}.${sig}`, "os-incriveis", t0 + 5_000)).toBe("invalid");
    expect(verifyFormToken("lixo", "os-incriveis", t0)).toBe("invalid");
  });
});
