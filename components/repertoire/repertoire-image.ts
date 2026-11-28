import { PRODUCT_NAME } from "@/components/ui/Brand";
import { logoPlacement } from "@/lib/band-logo";
import { repertoireSummary, shareHeading, type ShareOptions, type ShareSong } from "@/lib/repertoire";
import { formatDuration } from "@/lib/spotify";

/**
 * Imagem PNG (e a página do PDF) do repertório, desenhadas num <canvas> no navegador.
 * É um arquivo, não UI: as cores ficam aqui (não há tema/tokens dentro da imagem).
 * Até 24 músicas: 1 coluna (1080px). Mais: 2 colunas (1600px) para a imagem não ficar comprida
 * demais (o WhatsApp reduz imagens muito altas e o Safari limita a área do canvas).
 */

export type ImageTheme = "light" | "dark";

const PALETTES: Record<
  ImageTheme,
  { bg: string; fg: string; muted: string; note: string; line: string; number: string }
> = {
  light: { bg: "#ffffff", fg: "#18181b", muted: "#6b6b76", note: "#a14a06", line: "#e4e4e7", number: "#a1a1aa" },
  dark: { bg: "#151518", fg: "#fafafa", muted: "#a1a1aa", note: "#fbbf24", line: "#2e2e33", number: "#71717a" },
};

const PAD = 72;
const GAP = 64;

type Line = { text: string; font: string; color: string; size: number; gapBefore: number };
type Item = { number: string; lines: Line[]; height: number };

function wrap(ctx: CanvasRenderingContext2D, text: string, font: string, maxWidth: number): string[] {
  ctx.font = font;
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth) {
      current = attempt;
      continue;
    }
    if (current) lines.push(current);
    // Palavra maior que a linha: quebra por caractere.
    current = "";
    for (const ch of word) {
      if (ctx.measureText(current + ch).width > maxWidth && current) {
        lines.push(current);
        current = "";
      }
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

type RenderInput = {
  bandName: string;
  name: string;
  description: string | null;
  songs: ShareSong[];
  options: ShareOptions;
  theme: ImageTheme;
  fontFamily: string;
  /** Nome do evento do show (opção "Mostrar nome do evento" → vira o título). */
  eventName?: string | null;
  /** Logo da banda (já carregada, mesma origem). Vai no canto superior direito. */
  logo?: HTMLImageElement | null;
};

/** Caixa da logo no canto superior direito (unidades de desenho). */
const LOGO_BOX = { width: 240, height: 120, gap: 40 } as const;

/** Desenha a logo alinhada à direita e ao topo; devolve a altura ocupada (0 sem logo). */
function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null | undefined,
  right: number,
  top: number,
  box: { width: number; height: number },
): number {
  if (!logo || !logo.naturalWidth) return 0;
  const place = logoPlacement({ width: logo.naturalWidth, height: logo.naturalHeight }, { right, top }, box);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logo, place.x, place.y, place.width, place.height);
  return place.height;
}

/** Altura que a logo vai ocupar (para reservar espaço antes de desenhar). */
function logoHeight(logo: HTMLImageElement | null | undefined, box: { width: number; height: number }): number {
  if (!logo || !logo.naturalWidth) return 0;
  return logoPlacement({ width: logo.naturalWidth, height: logo.naturalHeight }, { right: 0, top: 0 }, box).height;
}

const ROW_GAP = 26;
const lineHeight = (l: Line) => l.gapBefore + Math.round(l.size * 1.25);

/** Mede e quebra o texto: cabeçalho e músicas já em linhas (largura do texto em px). */
/** `headerWidth`: largura do texto do cabeçalho (menor que o conteúdo quando há logo à direita). */
function layout(input: RenderInput, contentWidth: number, textWidth: number, headerWidth = contentWidth) {
  const { bandName, name, description, songs, options, theme, fontFamily } = input;
  const colors = PALETTES[theme];
  const font = (weight: number, size: number) => `${weight} ${size}px ${fontFamily}`;
  const measure = document.createElement("canvas").getContext("2d")!;

  // Sem o título do repertório, o nome da banda vira o título (como no texto do WhatsApp).
  const titleLines = (text: string, firstGap: number): Line[] =>
    wrap(measure, text, font(700, 60), headerWidth).map((t, i) => ({
      text: t,
      font: font(700, 60),
      color: colors.fg,
      size: 60,
      gapBefore: i === 0 ? firstGap : 6,
    }));
  const heading = shareHeading({ name, eventName: input.eventName, options });
  const header: Line[] = [
    ...(heading.text
      ? [
          { text: bandName.toUpperCase(), font: font(600, 26), color: colors.muted, size: 26, gapBefore: 0 },
          ...titleLines(heading.text, 18),
        ]
      : titleLines(bandName, 0)),
    ...(description?.trim()
      ? wrap(measure, description.trim(), font(400, 28), headerWidth).map((text, i) => ({
          text,
          font: font(400, 28),
          color: colors.muted,
          size: 28,
          gapBefore: i === 0 ? 14 : 4,
        }))
      : []),
    { text: repertoireSummary(songs), font: font(500, 28), color: colors.muted, size: 28, gapBefore: 18 },
  ];

  const items: Item[] = songs.map((song, i) => {
    const d = options.durations ? formatDuration(song.durationMs) : null;
    const title = d ? `${song.title}  ·  ${d}` : song.title;
    const lines: Line[] = wrap(measure, title, font(600, 34), textWidth).map((text, j) => ({
      text,
      font: font(600, 34),
      color: colors.fg,
      size: 34,
      gapBefore: j === 0 ? 0 : 2,
    }));
    if (options.artists && song.artists?.trim()) {
      for (const text of wrap(measure, song.artists.trim(), font(400, 27), textWidth)) {
        lines.push({ text, font: font(400, 27), color: colors.muted, size: 27, gapBefore: 2 });
      }
    }
    if (options.notes && song.notes?.trim()) {
      wrap(measure, `↳ ${song.notes.trim()}`, font(500, 26), textWidth).forEach((text, j) =>
        lines.push({ text, font: font(500, 26), color: colors.note, size: 26, gapBefore: j === 0 ? 6 : 2 }),
      );
    }
    return { number: String(i + 1), lines, height: lines.reduce((h, l) => h + lineHeight(l), 0) };
  });

  return { colors, font, header, items, headerHeight: header.reduce((h, l) => h + lineHeight(l), 0) };
}

function drawLines(ctx: CanvasRenderingContext2D, lines: Line[], x: number, top: number): number {
  let y = top;
  for (const l of lines) {
    y += l.gapBefore + l.size;
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, x, y);
    y += Math.round(l.size * 0.25);
  }
  return y;
}

function drawItem(
  ctx: CanvasRenderingContext2D,
  item: Item,
  x: number,
  top: number,
  numberWidth: number,
  font: (weight: number, size: number) => string,
  numberColor: string,
) {
  let ly = top;
  item.lines.forEach((l, j) => {
    ly += l.gapBefore + l.size;
    if (j === 0) {
      ctx.font = font(700, 30);
      ctx.fillStyle = numberColor;
      ctx.textAlign = "right";
      ctx.fillText(item.number, x + numberWidth - 18, ly);
      ctx.textAlign = "left";
    }
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, x + numberWidth, ly);
    ly += Math.round(l.size * 0.25);
  });
}

function newCanvas(width: number, height: number, bg: string) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";
  return { canvas, ctx };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem"))), type, quality),
  );
}

export async function renderRepertoireImage(input: RenderInput): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
  const columns = input.songs.length > 24 ? 2 : 1;
  const width = columns === 2 ? 1600 : 1080;
  const contentWidth = width - PAD * 2;
  const columnWidth = (contentWidth - GAP * (columns - 1)) / columns;
  const numberWidth = input.songs.length >= 100 ? 76 : 60;
  const hasLogo = !!input.logo?.naturalWidth;
  const { colors, font, header, items, headerHeight } = layout(
    input,
    contentWidth,
    columnWidth - numberWidth,
    hasLogo ? contentWidth - LOGO_BOX.width - LOGO_BOX.gap : contentWidth,
  );

  const perColumn = Math.ceil(items.length / columns);
  const columnItems = Array.from({ length: columns }, (_, c) => items.slice(c * perColumn, (c + 1) * perColumn));
  const columnHeights = columnItems.map((list) => list.reduce((h, it) => h + it.height + ROW_GAP, 0));
  const listTop = PAD + Math.max(headerHeight, logoHeight(input.logo, LOGO_BOX)) + 44;
  const footerHeight = 90;
  const height = Math.ceil(listTop + Math.max(0, ...columnHeights) + footerHeight);

  const { canvas, ctx } = newCanvas(width, height, colors.bg);
  drawLines(ctx, header, PAD, PAD);
  drawLogo(ctx, input.logo, width - PAD, PAD, LOGO_BOX);
  ctx.fillStyle = colors.line;
  ctx.fillRect(PAD, listTop - 24, contentWidth, 2);

  columnItems.forEach((list, c) => {
    const x = PAD + c * (columnWidth + GAP);
    let top = listTop;
    for (const item of list) {
      drawItem(ctx, item, x, top, numberWidth, font, colors.number);
      top += item.height + ROW_GAP;
    }
  });

  ctx.fillStyle = colors.line;
  ctx.fillRect(PAD, height - footerHeight + 10, contentWidth, 2);
  ctx.font = font(500, 22);
  ctx.fillStyle = colors.muted;
  ctx.fillText(`Feito com ${PRODUCT_NAME}`, PAD, height - 36);

  return toBlob(canvas, "image/png");
}

/** Página A4 a 300 dpi (2480×3508 px): letras pequenas continuam nítidas na impressão. */
export const PDF_PAGE_PX = { width: 2480, height: 3508 } as const;

/** Página A4 em "unidades de desenho" (150 dpi); o canvas é desenhado com escala 2. */
const PDF_DESIGN = { width: 1240, height: 1754, pad: 80, footer: 70, resolution: 2 } as const;

export type PdfPage = {
  jpeg: Uint8Array;
  /** true = para caber numa página, artistas e observações ficaram de fora. */
  compact: boolean;
};

/**
 * PDF do repertório em UMA página A4, com a lista em duas colunas (fundo claro, para imprimir).
 * Para caber, o desenho é reduzido (escala de 1 até 0,4); as colunas são equilibradas pela altura
 * (ordem: desce a 1ª coluna e continua na 2ª). Se nem assim couber, tira artistas e observações
 * (`compact`) e reduz mais. Devolve a página em JPEG (o PDF embute JPEG direto).
 */
export async function renderRepertoirePdfPage(input: Omit<RenderInput, "theme">): Promise<PdfPage> {
  if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
  const { width, height, pad, footer, resolution } = PDF_DESIGN;
  const numberWidth = input.songs.length >= 100 ? 76 : 60;

  const attempt = (scale: number, compact: boolean) => {
    // Reduzir = desenhar numa página "maior" e encolher no fim (o texto também quebra menos).
    const vw = width / scale;
    const vh = height / scale;
    const contentWidth = vw - pad * 2;
    const columnWidth = (contentWidth - GAP) / 2;
    const options = compact ? { ...input.options, artists: false, notes: false } : input.options;
    // A logo mantém o mesmo tamanho na folha, qualquer que seja a redução da lista.
    const logoBox = { width: LOGO_BOX.width / scale, height: LOGO_BOX.height / scale };
    const hasLogo = !!input.logo?.naturalWidth;
    const result = layout(
      { ...input, options, theme: "light" },
      contentWidth,
      columnWidth - numberWidth,
      hasLogo ? contentWidth - logoBox.width - LOGO_BOX.gap / scale : contentWidth,
    );
    // Equilíbrio pela altura: a 1ª coluna vai até passar da metade do total.
    const total = result.items.reduce((h, it) => h + it.height + ROW_GAP, 0);
    let split = 0;
    let acc = 0;
    while (split < result.items.length && acc + (result.items[split].height + ROW_GAP) / 2 <= total / 2) {
      acc += result.items[split].height + ROW_GAP;
      split++;
    }
    const columns = [result.items.slice(0, split), result.items.slice(split)];
    const columnHeight = Math.max(...columns.map((list) => list.reduce((h, it) => h + it.height + ROW_GAP, 0)));
    const listTop = pad + Math.max(result.headerHeight, logoHeight(input.logo, logoBox)) + 44;
    const fits = listTop + columnHeight + footer + pad <= vh;
    return { ...result, scale, compact, vw, vh, contentWidth, columnWidth, columns, listTop, fits, logoBox };
  };

  let plan: ReturnType<typeof attempt> | null = null;
  outer: for (const compact of [false, true]) {
    const minScale = compact ? 0.25 : 0.4;
    for (let scale = 1; scale >= minScale - 1e-9; scale -= 0.025) {
      const candidate = attempt(scale, compact);
      plan = candidate;
      if (candidate.fits) break outer;
    }
  }
  const p = plan!;

  const { canvas, ctx } = newCanvas(PDF_PAGE_PX.width, PDF_PAGE_PX.height, p.colors.bg);
  ctx.scale(resolution * p.scale, resolution * p.scale);
  drawLines(ctx, p.header, pad, pad);
  drawLogo(ctx, input.logo, p.vw - pad, pad, p.logoBox);
  ctx.fillStyle = p.colors.line;
  ctx.fillRect(pad, p.listTop - 24, p.contentWidth, 2);
  p.columns.forEach((list, c) => {
    const x = pad + c * (p.columnWidth + GAP);
    let y = p.listTop;
    for (const item of list) {
      drawItem(ctx, item, x, y, numberWidth, p.font, p.colors.number);
      y += item.height + ROW_GAP;
    }
  });
  const footerTop = p.vh - pad - footer + 20;
  ctx.fillStyle = p.colors.line;
  ctx.fillRect(pad, footerTop, p.contentWidth, 2);
  ctx.font = p.font(500, 22);
  ctx.fillStyle = p.colors.muted;
  ctx.fillText(`Feito com ${PRODUCT_NAME}`, pad, footerTop + 40);

  const blob = await toBlob(canvas, "image/jpeg", 0.9);
  return { jpeg: new Uint8Array(await blob.arrayBuffer()), compact: p.compact };
}
