import { beforeAll, describe, expect, it } from "vitest";
import { bandLinkToken, bandLinkUrl, generateBandLinkNonce, parseBandLinkToken } from "./band-link";

beforeAll(() => {
  process.env.AUTH_SECRET ??= "segredo-de-teste";
});

describe("link de convite da banda", () => {
  it("token assinado volta ao nonce", () => {
    const nonce = generateBandLinkNonce();
    expect(nonce).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(parseBandLinkToken(bandLinkToken(nonce))).toBe(nonce);
  });
  it("recusa assinatura errada, nonce trocado ou formato inválido", () => {
    const nonce = generateBandLinkNonce();
    const [, signature] = bandLinkToken(nonce).split(".");
    expect(parseBandLinkToken(`${generateBandLinkNonce()}.${signature}`)).toBeNull();
    expect(parseBandLinkToken(`${nonce}.${signature.slice(0, -1)}x`)).toBeNull();
    expect(parseBandLinkToken(nonce)).toBeNull();
    expect(parseBandLinkToken("")).toBeNull();
    expect(parseBandLinkToken(`a.b.c`)).toBeNull();
  });
  it("só o nonce não basta (o banco não guarda a assinatura)", () => {
    const nonce = generateBandLinkNonce();
    expect(bandLinkToken(nonce)).not.toBe(nonce);
    expect(bandLinkToken(nonce).startsWith(`${nonce}.`)).toBe(true);
  });
  it("URL do link", () => {
    const nonce = generateBandLinkNonce();
    expect(bandLinkUrl("https://app.banda.com", nonce)).toBe(
      `https://app.banda.com/convite/banda/${bandLinkToken(nonce)}`,
    );
  });
});
