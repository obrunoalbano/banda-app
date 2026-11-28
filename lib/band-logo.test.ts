import { describe, expect, it } from "vitest";
import { bandLogoUrl, fitWithin, LOGO_LIMITS, logoPlacement, pngDimensions, validateLogoPng } from "./band-logo";

/** PNG mínimo (só assinatura + IHDR) com a largura/altura pedidas. */
function fakePng(width: number, height: number, extra = 0): Uint8Array {
  const bytes = new Uint8Array(33 + extra);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0, 0, 0, 13], 8);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // IHDR
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe("pngDimensions / validateLogoPng", () => {
  it("lê largura e altura", () => {
    expect(pngDimensions(fakePng(640, 320))).toEqual({ width: 640, height: 320 });
  });
  it("recusa o que não é PNG", () => {
    expect(pngDimensions(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, ...new Array(30).fill(0)]))).toBeNull();
    expect(validateLogoPng(new Uint8Array([1, 2, 3]))).toBe("Formato inválido. Envie a imagem de novo.");
  });
  it("aceita PNG dentro dos limites", () => {
    expect(validateLogoPng(fakePng(800, 400))).toBeNull();
  });
  it("recusa vazio, grande demais e dimensões acima do limite", () => {
    expect(validateLogoPng(new Uint8Array())).toBe("Envie uma imagem.");
    expect(validateLogoPng(fakePng(100, 100, LOGO_LIMITS.maxStoredBytes))).toMatch(/muito grande/);
    expect(validateLogoPng(fakePng(801, 100))).toMatch(/grande demais/);
  });
});

describe("fitWithin / logoPlacement", () => {
  it("reduz mantendo a proporção e nunca aumenta", () => {
    expect(fitWithin(1600, 800, 800, 800)).toEqual({ width: 800, height: 400 });
    expect(fitWithin(300, 900, 800, 800)).toEqual({ width: 267, height: 800 });
    expect(fitWithin(100, 50, 800, 800)).toEqual({ width: 100, height: 50 });
  });
  it("logo larga ocupa a largura da caixa, alinhada à direita e ao topo", () => {
    expect(logoPlacement({ width: 800, height: 200 }, { right: 1000, top: 72 }, { width: 240, height: 120 })).toEqual({
      x: 760,
      y: 72,
      width: 240,
      height: 60,
    });
  });
  it("logo alta ocupa a altura da caixa", () => {
    expect(logoPlacement({ width: 300, height: 600 }, { right: 1000, top: 72 }, { width: 240, height: 120 })).toEqual({
      x: 940,
      y: 72,
      width: 60,
      height: 120,
    });
  });
  it("URL com versão", () => {
    expect(bandLogoUrl(new Date(1700000000000))).toBe("/banda/logo?v=1700000000000");
    expect(bandLogoUrl(null)).toBeNull();
  });
});
