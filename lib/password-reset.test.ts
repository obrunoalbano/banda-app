import { describe, expect, it } from "vitest";
import {
  PASSWORD_RESET_TTL_MS,
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetBaseUrl,
  passwordResetEmail,
  passwordResetUrl,
} from "./password-reset";

describe("token de redefinição", () => {
  it("guarda só o hash e expira no prazo", () => {
    const now = Date.UTC(2026, 9, 27, 12);
    const { token, hash, expiresAt } = generatePasswordResetToken(now);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toBe(hashPasswordResetToken(token));
    expect(hash).not.toContain(token);
    expect(expiresAt.getTime()).toBe(now + PASSWORD_RESET_TTL_MS);
  });
  it("não repete", () => {
    expect(new Set(Array.from({ length: 100 }, () => generatePasswordResetToken().token)).size).toBe(100);
  });
});

describe("base do link", () => {
  const requestUrl = "https://atacante.example/api/password/forgot";
  it("usa NEXT_PUBLIC_APP_URL (sem barra final)", () => {
    expect(passwordResetBaseUrl({ appUrl: "https://app.banda.com/", requestUrl, isProduction: true })).toBe(
      "https://app.banda.com",
    );
  });
  it("produção sem URL configurada: não confia no Host", () => {
    expect(passwordResetBaseUrl({ appUrl: undefined, requestUrl, isProduction: true })).toBeNull();
    expect(passwordResetBaseUrl({ appUrl: "  ", requestUrl, isProduction: true })).toBeNull();
  });
  it("desenvolvimento: origem da requisição", () => {
    expect(
      passwordResetBaseUrl({ appUrl: undefined, requestUrl: "http://localhost:3000/api/x", isProduction: false }),
    ).toBe("http://localhost:3000");
  });
});

describe("email", () => {
  it("link com token codificado e nome escapado no HTML", () => {
    const url = passwordResetUrl("https://app.banda.com", "a+b/c");
    expect(url).toBe("https://app.banda.com/redefinir-senha?token=a%2Bb%2Fc");
    const email = passwordResetEmail({ name: "<Os Ruídos>", url });
    expect(email.text).toContain(url);
    expect(email.html).toContain("&#60;Os Ruídos&#62;");
    expect(email.html).not.toContain("<Os Ruídos>");
  });
});
