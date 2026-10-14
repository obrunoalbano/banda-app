import { compare } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { generateTempPassword, hashPassword } from "./passwords";

describe("senha provisória", () => {
  it("formato legível e sem caracteres ambíguos", () => {
    for (let i = 0; i < 50; i++) {
      const p = generateTempPassword();
      expect(p).toMatch(/^[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}-[a-zA-Z2-9]{4}$/);
      expect(p).not.toMatch(/[01lIoO]/);
    }
  });
  it("não repete", () => {
    expect(new Set(Array.from({ length: 200 }, generateTempPassword)).size).toBe(200);
  });
  it("hash confere", async () => {
    const p = generateTempPassword();
    expect(await compare(p, await hashPassword(p))).toBe(true);
  });
});
