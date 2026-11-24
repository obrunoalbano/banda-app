import { PRODUCT_NAME } from "@/components/ui/Brand";
import { repertoireSummary, type ShareOptions, type ShareSong } from "@/lib/repertoire";
import { formatDuration } from "@/lib/spotify";

/**
 * Imagem PNG do repertório (para mandar no WhatsApp), desenhada num <canvas> no navegador.
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

export async function renderRepertoireImage({
  bandName,
  name,
  description,
  songs,
  options,
  theme,
  fontFamily,
}: {
  bandName: string;
  name: string;
  description: string | null;
  songs: ShareSong[];
  options: ShareOptions;
  theme: ImageTheme;
  fontFamily: string;
}): Promise<Blob> {
  if (typeof document !== "undefined" && document.fonts?.ready) await document.fonts.ready;
  const colors = PALETTES[theme];
  const columns = songs.length > 24 ? 2 : 1;
  const width = columns === 2 ? 1600 : 1080;
  const contentWidth = width - PAD * 2;
  const columnWidth = (contentWidth - GAP * (columns - 1)) / columns;
  const numberWidth = songs.length >= 100 ? 76 : 60;
  const textWidth = columnWidth - numberWidth;

  const font = (weight: number, size: number) => `${weight} ${size}px ${fontFamily}`;
  const measure = document.createElement("canvas").getContext("2d")!;

  // Cabeçalho.
  const header: Line[] = [
    { text: bandName.toUpperCase(), font: font(600, 26), color: colors.muted, size: 26, gapBefore: 0 },
    ...wrap(measure, name, font(700, 60), contentWidth).map((text, i) => ({
      text,
      font: font(700, 60),
      color: colors.fg,
      size: 60,
      gapBefore: i === 0 ? 18 : 6,
    })),
    ...(description?.trim()
      ? wrap(measure, description.trim(), font(400, 28), contentWidth).map((text, i) => ({
          text,
          font: font(400, 28),
          color: colors.muted,
          size: 28,
          gapBefore: i === 0 ? 14 : 4,
        }))
      : []),
    { text: repertoireSummary(songs), font: font(500, 28), color: colors.muted, size: 28, gapBefore: 18 },
  ];
  const lineHeight = (l: Line) => l.gapBefore + Math.round(l.size * 1.25);
  const headerHeight = header.reduce((h, l) => h + lineHeight(l), 0);

  // Músicas.
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

  const ROW_GAP = 26;
  const perColumn = Math.ceil(items.length / columns);
  const columnItems = Array.from({ length: columns }, (_, c) => items.slice(c * perColumn, (c + 1) * perColumn));
  const columnHeights = columnItems.map((list) => list.reduce((h, it) => h + it.height + ROW_GAP, 0));
  const listTop = PAD + headerHeight + 44;
  const footerHeight = 90;
  const height = Math.ceil(listTop + Math.max(0, ...columnHeights) + footerHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "alphabetic";

  let y = PAD;
  for (const l of header) {
    y += l.gapBefore + l.size;
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, PAD, y);
    y += Math.round(l.size * 0.25);
  }
  ctx.fillStyle = colors.line;
  ctx.fillRect(PAD, listTop - 24, contentWidth, 2);

  columnItems.forEach((list, c) => {
    const x = PAD + c * (columnWidth + GAP);
    let top = listTop;
    for (const item of list) {
      let ly = top;
      item.lines.forEach((l, j) => {
        ly += l.gapBefore + l.size;
        if (j === 0) {
          ctx.font = font(700, 30);
          ctx.fillStyle = colors.number;
          ctx.textAlign = "right";
          ctx.fillText(item.number, x + numberWidth - 18, ly);
          ctx.textAlign = "left";
        }
        ctx.font = l.font;
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, x + numberWidth, ly);
        ly += Math.round(l.size * 0.25);
      });
      top += item.height + ROW_GAP;
    }
  });

  ctx.fillStyle = colors.line;
  ctx.fillRect(PAD, height - footerHeight + 10, contentWidth, 2);
  ctx.font = font(500, 22);
  ctx.fillStyle = colors.muted;
  ctx.fillText(`Feito com ${PRODUCT_NAME}`, PAD, height - 36);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar a imagem"))), "image/png"),
  );
}
