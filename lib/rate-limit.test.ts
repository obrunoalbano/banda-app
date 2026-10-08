import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimits());
  const opts = { limit: 2, windowMs: 1000 };

  it("bloqueia após o limite e libera na próxima janela", () => {
    expect(rateLimit("k", opts, 0).ok).toBe(true);
    expect(rateLimit("k", opts, 10).ok).toBe(true);
    const blocked = rateLimit("k", opts, 20);
    expect(blocked).toEqual({ ok: false, retryAfterSeconds: 1 });
    expect(rateLimit("k", opts, 1000).ok).toBe(true);
  });
  it("chaves são independentes", () => {
    rateLimit("a", opts, 0);
    rateLimit("a", opts, 0);
    expect(rateLimit("a", opts, 0).ok).toBe(false);
    expect(rateLimit("b", opts, 0).ok).toBe(true);
  });
});
