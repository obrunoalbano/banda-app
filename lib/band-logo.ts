/**
 * Logo da banda (Minha banda → Dados da banda). Usada no "Compartilhar" do repertório (imagem e
 * PDF), sempre no canto superior direito. Ver docs/ensaios.md.
 *
 * O navegador reduz a imagem escolhida (até `maxSide` px) e envia um PNG; o servidor não processa
 * a imagem, só confere: assinatura PNG, dimensões (cabeçalho IHDR) e tamanho. Fica no banco
 * (BandLogo.data), servida por /banda/logo. Funções puras, com teste.
 */

export const LOGO_LIMITS = {
  /** Arquivo escolhido pela pessoa (antes de reduzir). */
  maxUploadBytes: 2 * 1024 * 1024,
  /** PNG já reduzido que chega na API. */
  maxStoredBytes: 1024 * 1024,
  /** Maior lado do PNG guardado. */
  maxSide: 800,
  /** Formatos aceitos no campo (o navegador converte para PNG). */
  acceptedTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
} as const;

export const LOGO_ACCEPT_LABEL = "PNG, JPG, WebP ou SVG, até 2 MB";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Largura/altura de um PNG (chunk IHDR) ou null se não for PNG válido. */
export function pngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  if (!PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return null;
  // Bytes 12..15 = "IHDR"; 16..19 largura; 20..23 altura (big-endian).
  if (String.fromCharCode(...bytes.subarray(12, 16)) !== "IHDR") return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  return width > 0 && height > 0 ? { width, height } : null;
}

/** Valida o PNG enviado. `null` = ok; senão, a mensagem de erro (pt-BR). */
export function validateLogoPng(bytes: Uint8Array): string | null {
  if (bytes.length === 0) return "Envie uma imagem.";
  if (bytes.length > LOGO_LIMITS.maxStoredBytes) return "Imagem muito grande. Use um arquivo menor.";
  const size = pngDimensions(bytes);
  if (!size) return "Formato inválido. Envie a imagem de novo.";
  if (size.width > LOGO_LIMITS.maxSide || size.height > LOGO_LIMITS.maxSide) {
    return "Imagem grande demais. Envie a imagem de novo.";
  }
  return null;
}

/** Tamanho que cabe em `maxWidth`×`maxHeight` mantendo a proporção (nunca aumenta). */
export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * Onde desenhar a logo: dentro de uma caixa `box` no canto superior direito (alinhada à direita
 * e ao topo da área de conteúdo). Logos largas ocupam a largura; altas, a altura.
 */
export function logoPlacement(
  logo: { width: number; height: number },
  area: { right: number; top: number },
  box: { width: number; height: number },
): { x: number; y: number; width: number; height: number } {
  const size = fitWithin(logo.width, logo.height, box.width, box.height);
  // Logo pequena (ex.: 120 px) também é ampliada até a caixa: no documento ela precisa aparecer.
  const scale = Math.min(box.width / size.width, box.height / size.height);
  const width = Math.round(size.width * scale);
  const height = Math.round(size.height * scale);
  return { x: area.right - width, y: area.top, width, height };
}

/** URL da logo com versão (troca de logo = URL nova, sem cache antigo). */
export function bandLogoUrl(updatedAt: Date | null | undefined): string | null {
  return updatedAt ? `/banda/logo?v=${updatedAt.getTime()}` : null;
}
