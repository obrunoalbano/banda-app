import { describe, expect, it } from "vitest";
import {
  INVITE_TTL_DAYS,
  generateInviteToken,
  hashInviteToken,
  inviteEmail,
  inviteUrl,
  lastAdminBlock,
  memberStatus,
  pickActiveMembership,
} from "./members";

describe("convite", () => {
  it("guarda só o hash e expira no prazo", () => {
    const now = Date.UTC(2026, 10, 24, 12);
    const { token, hash, expiresAt } = generateInviteToken(now);
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hash).toBe(hashInviteToken(token));
    expect(expiresAt.getTime()).toBe(now + INVITE_TTL_DAYS * 86_400_000);
  });
  it("monta o link e escapa o email", () => {
    expect(inviteUrl("https://app.test", "a/b")).toBe("https://app.test/convite/a%2Fb");
    const email = inviteEmail({ bandName: "<Os Ruídos>", inviterName: "Ana", url: "https://app.test/convite/x" });
    expect(email.html).not.toContain("<Os");
    expect(email.text).toContain("https://app.test/convite/x");
  });
});

describe("memberStatus", () => {
  const now = new Date("2026-11-24T12:00:00Z");
  it("conta vinculada = ativo; convite no prazo = pendente; vencido = expirado", () => {
    expect(memberStatus({ userId: "u", inviteExpiresAt: null }, now)).toBe("active");
    expect(memberStatus({ userId: null, inviteExpiresAt: new Date("2026-11-30") }, now)).toBe("pending");
    expect(memberStatus({ userId: null, inviteExpiresAt: new Date("2026-11-01") }, now)).toBe("expired");
    expect(memberStatus({ userId: null, inviteExpiresAt: null }, now)).toBe("expired");
  });
});

describe("lastAdminBlock", () => {
  const admin = { id: "a", role: "ADMIN" as const, userId: "u1" };
  const viewer = { id: "v", role: "VIEWER" as const, userId: "u2" };
  const pendingAdmin = { id: "p", role: "ADMIN" as const, userId: null };

  it("bloqueia remover ou rebaixar o único administrador com conta", () => {
    expect(lastAdminBlock([admin, viewer, pendingAdmin], admin, { type: "remove" })).toMatch(/pelo menos um administrador/);
    expect(lastAdminBlock([admin, viewer], admin, { type: "role", role: "VIEWER" })).toMatch(/mudar este papel/);
  });
  it("libera quando há outro administrador com conta", () => {
    const admin2 = { id: "b", role: "ADMIN" as const, userId: "u3" };
    expect(lastAdminBlock([admin, admin2], admin, { type: "remove" })).toBeNull();
  });
  it("não se aplica a visualizadores, convites e promoção", () => {
    expect(lastAdminBlock([admin, viewer], viewer, { type: "remove" })).toBeNull();
    expect(lastAdminBlock([admin, pendingAdmin], pendingAdmin, { type: "remove" })).toBeNull();
    expect(lastAdminBlock([admin], admin, { type: "role", role: "ADMIN" })).toBeNull();
  });
});

describe("pickActiveMembership", () => {
  const ms = [{ bandId: "b1" }, { bandId: "b2" }];
  it("usa a banda preferida se ainda for membro, senão a primeira", () => {
    expect(pickActiveMembership(ms, "b2")).toEqual({ bandId: "b2" });
    expect(pickActiveMembership(ms, "removida")).toEqual({ bandId: "b1" });
    expect(pickActiveMembership(ms, null)).toEqual({ bandId: "b1" });
    expect(pickActiveMembership([], "b1")).toBeNull();
  });
});
