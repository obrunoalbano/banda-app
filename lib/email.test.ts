import { describe, expect, it } from "vitest";
import { resendFailureReason } from "./email";

describe("resendFailureReason", () => {
  it("usa a mensagem da Resend", () => {
    const body = JSON.stringify({ statusCode: 403, name: "validation_error", message: "The domain is not verified." });
    expect(resendFailureReason(403, body)).toBe("Resend 403: The domain is not verified.");
  });
  it("corpo não-JSON ou vazio", () => {
    expect(resendFailureReason(500, "Internal  error\n")).toBe("Resend 500: Internal error");
    expect(resendFailureReason(502, "")).toBe("Resend 502");
  });
  it("corta mensagens longas", () => {
    expect(resendFailureReason(400, "x".repeat(500)).length).toBeLessThanOrEqual(212);
  });
});
