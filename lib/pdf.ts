/**
 * PDF mínimo a partir de imagens JPEG, uma por página (sem biblioteca). O JPEG entra direto no
 * PDF (filtro DCTDecode), então não precisa decodificar nada. Usado no "Compartilhar → PDF" do
 * repertório (páginas desenhadas em canvas). Função pura: recebe bytes, devolve bytes.
 */

export type PdfImagePage = {
  /** Bytes do JPEG (RGB). */
  jpeg: Uint8Array;
  /** Tamanho da imagem em pixels. */
  width: number;
  height: number;
};

/** A4 em pontos (1/72 pol.). */
export const A4_POINTS = { width: 595.28, height: 841.89 } as const;

const encoder = new TextEncoder();

export function jpegPagesToPdf(pages: PdfImagePage[], pageSize = A4_POINTS): Uint8Array {
  if (pages.length === 0) throw new Error("PDF sem páginas");
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (data: Uint8Array | string) => {
    const bytes = typeof data === "string" ? encoder.encode(data) : data;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (id: number, body: () => void) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
    body();
    push("\nendobj\n");
  };

  // %PDF + comentário binário (marca o arquivo como binário para transferências).
  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  // Objetos: 1 catálogo, 2 páginas; para cada página i: página, conteúdo, imagem.
  const pageId = (i: number) => 3 + i * 3;
  const w = pageSize.width.toFixed(2);
  const h = pageSize.height.toFixed(2);

  object(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  object(2, () =>
    push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(" ")}] /Count ${pages.length} >>`),
  );
  pages.forEach((page, i) => {
    const id = pageId(i);
    object(id, () =>
      push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im${i} ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`,
      ),
    );
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im${i} Do Q`;
    object(id + 1, () => push(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`));
    object(id + 2, () => {
      push(
        `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
      );
      push(page.jpeg);
      push("\nendstream");
    });
  });

  const count = 3 + pages.length * 3;
  const xref = length;
  push(`xref\n0 ${count}\n0000000000 65535 f \n`);
  for (let id = 1; id < count; id++) push(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`);
  push(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let pos = 0;
  for (const c of chunks) {
    out.set(c, pos);
    pos += c.length;
  }
  return out;
}
