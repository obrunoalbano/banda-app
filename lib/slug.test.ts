import { describe, expect, it } from "vitest";
import { baseSlugFor, slugCandidate, slugError, slugify, SLUG_MAX } from "./slug";

describe("slugify", () => {
  it.each([
    ["Os Incríveis", "os-incriveis"],
    ["  Banda   do  Zé!! ", "banda-do-ze"],
    ["Ação & Reação 2026", "acao-reacao-2026"],
    ["---", ""],
  ])("%s → %s", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
  it("corta no máximo sem terminar em hífen", () => {
    const s = slugify("a ".repeat(60));
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("slugError", () => {
  it("aceita slug válido", () => expect(slugError("os-incriveis")).toBeNull());
  it.each(["ab", "Os-Incriveis", "os--incriveis", "-os", "os_incriveis", "embed", "a".repeat(51)])(
    "rejeita %s",
    (s) => expect(slugError(s)).not.toBeNull(),
  );
});

describe("slug de banda nova", () => {
  it("garante mínimo e evita reservados", () => {
    expect(baseSlugFor("!!")).toBe("banda");
    expect(baseSlugFor("Zé")).toBe("banda-ze");
    expect(baseSlugFor("Login")).toBe("banda-login");
    expect(baseSlugFor("Os Incríveis")).toBe("os-incriveis");
  });
  it("candidatos com sufixo cabem no limite", () => {
    expect(slugCandidate("os-incriveis", 1)).toBe("os-incriveis");
    expect(slugCandidate("os-incriveis", 3)).toBe("os-incriveis-3");
    const long = "a".repeat(SLUG_MAX);
    expect(slugCandidate(long, 12)).toHaveLength(SLUG_MAX);
    expect(slugError(slugCandidate(long, 12))).toBeNull();
  });
});
