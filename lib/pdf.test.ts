import { describe, expect, it } from "vitest";
import { jpegPagesToPdf } from "./pdf";

// "JPEG" falso: o PDF não decodifica a imagem, só embute os bytes.
const fakeJpeg = (n: number) => new Uint8Array([0xff, 0xd8, n, 0x00, 0xff, 0xd9]);
const latin1 = (bytes: Uint8Array) => Array.from(bytes, (b) => String.fromCharCode(b)).join("");

describe("jpegPagesToPdf", () => {
  const pdf = jpegPagesToPdf([
    { jpeg: fakeJpeg(1), width: 1240, height: 1754 },
    { jpeg: fakeJpeg(2), width: 1240, height: 1754 },
  ]);
  const text = latin1(pdf);

  it("tem cabeçalho, páginas e fim de arquivo", () => {
    expect(text.startsWith("%PDF-1.4\n")).toBe(true);
    expect(text.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(text).toContain("/Type /Pages /Kids [3 0 R 6 0 R] /Count 2");
    expect(text.match(/\/Type \/Page /g)).toHaveLength(2);
    expect(text).toContain("/Width 1240 /Height 1754");
    expect(text).toContain("/Filter /DCTDecode /Length 6");
  });

  it("tabela xref aponta para o início de cada objeto", () => {
    const startxref = Number(/startxref\n(\d+)/.exec(text)![1]);
    expect(text.slice(startxref, startxref + 4)).toBe("xref");
    const entries = text
      .slice(startxref)
      .split("\n")
      .slice(3, 3 + 8);
    entries.forEach((line, i) => {
      const offset = Number(line.slice(0, 10));
      expect(text.slice(offset, offset + `${i + 1} 0 obj`.length)).toBe(`${i + 1} 0 obj`);
    });
  });

  it("embute os bytes do JPEG sem alterar", () => {
    expect(text).toContain(latin1(fakeJpeg(2)));
  });

  it("recusa PDF vazio", () => {
    expect(() => jpegPagesToPdf([])).toThrow();
  });
});
