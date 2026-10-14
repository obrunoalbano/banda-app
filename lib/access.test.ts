import { describe, expect, it } from "vitest";
import { decideAccess, type SessionClaims } from "./access";

const band: SessionClaims = { role: "band", mustChangePassword: false };
const bandTemp: SessionClaims = { role: "band", mustChangePassword: true };
const admin: SessionClaims = { role: "superadmin", mustChangePassword: false };
const adminTemp: SessionClaims = { role: "superadmin", mustChangePassword: true };
const opts = { isProduction: true };
const decide = (path: string, s: SessionClaims) => decideAccess(path, s, opts);

describe("áreas públicas", () => {
  it.each(["/", "/login", "/cadastro", "/b/banda", "/embed/banda/shows", "/embed.js", "/api/public/v1/bands/x/shows", "/api/auth/session", "/api/register", "/api/leads/ingest", "/admin/login"])(
    "%s sem sessão → allow",
    (path) => expect(decide(path, null)).toEqual({ type: "allow" }),
  );
  it("design-system só fora de produção", () => {
    expect(decideAccess("/design-system", null, { isProduction: false })).toEqual({ type: "allow" });
    expect(decide("/design-system", null)).toMatchObject({ type: "redirect", to: "/login" });
  });
});

describe("app da banda", () => {
  it("sem sessão: página → /login, API → 401", () => {
    expect(decide("/casas", null)).toEqual({ type: "redirect", to: "/login", withCallback: true });
    expect(decide("/api/shows", null)).toMatchObject({ type: "json", status: 401 });
  });
  it("banda acessa", () => {
    expect(decide("/casas", band)).toEqual({ type: "allow" });
    expect(decide("/api/shows", band)).toEqual({ type: "allow" });
  });
  it("superadmin não entra no app da banda", () => {
    expect(decide("/casas", admin)).toEqual({ type: "redirect", to: "/admin" });
    expect(decide("/api/shows", admin)).toMatchObject({ type: "json", status: 403 });
  });
  it("senha provisória: só a troca de senha é liberada", () => {
    expect(decide("/casas", bandTemp)).toEqual({ type: "redirect", to: "/banda/senha" });
    expect(decide("/banda/senha", bandTemp)).toEqual({ type: "allow" });
    expect(decide("/api/shows", bandTemp)).toMatchObject({ type: "json", status: 403 });
    expect(decide("/api/band/password", bandTemp)).toEqual({ type: "allow" });
  });
});

describe("painel superadmin", () => {
  it("sem sessão: página → /admin/login, API → 401", () => {
    expect(decide("/admin/palcos", null)).toEqual({ type: "redirect", to: "/admin/login", withCallback: true });
    expect(decide("/api/admin/stages", null)).toMatchObject({ type: "json", status: 401 });
  });
  it("banda não entra no painel", () => {
    expect(decide("/admin/palcos", band)).toEqual({ type: "redirect", to: "/casas" });
    expect(decide("/api/admin/stages", band)).toMatchObject({ type: "json", status: 403 });
  });
  it("superadmin acessa; login redireciona para o painel", () => {
    expect(decide("/admin/palcos", admin)).toEqual({ type: "allow" });
    expect(decide("/api/admin/bands", admin)).toEqual({ type: "allow" });
    expect(decide("/admin/login", admin)).toEqual({ type: "redirect", to: "/admin" });
  });
  it("senha provisória do admin", () => {
    expect(decide("/admin/palcos", adminTemp)).toEqual({ type: "redirect", to: "/admin/senha" });
    expect(decide("/admin/senha", adminTemp)).toEqual({ type: "allow" });
    expect(decide("/api/admin/password", adminTemp)).toEqual({ type: "allow" });
    expect(decide("/api/admin/stages", adminTemp)).toMatchObject({ type: "json", status: 403 });
  });
  it("caminho parecido não vaza para o painel", () => {
    expect(decide("/administrativo", band)).toEqual({ type: "allow" });
  });
});
