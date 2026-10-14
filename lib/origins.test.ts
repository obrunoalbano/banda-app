import { describe, expect, it } from "vitest";
import { normalizeOrigin } from "./origins";

describe("normalizeOrigin", () => {
  it.each([
    ["meusite.com.br", "https://meusite.com.br"],
    ["  https://WWW.MeuSite.com/contato?x=1 ", "https://www.meusite.com"],
    ["https://site.com:8443/", "https://site.com:8443"],
    ["http://localhost:3000", "http://localhost:3000"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeOrigin(input)).toBe(expected);
  });
  it.each(["", "meusite", "http://meusite.com", "ftp://site.com", "javascript:alert(1)", "https://"])(
    "rejeita %s",
    (input) => expect(normalizeOrigin(input)).toBeNull(),
  );
});
