/**
 * Regras das imagens de palco (cópia otimizada no nosso storage). Módulo PURO — usado por
 * scripts/migrate-stage-images.mjs e scripts/import-stages.mjs; coberto por teste.
 */

/** Host da URL (minúsculo) ou null se inválida. */
export function imageHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** A imagem vem de um host autorizado (ex.: bucket da equipe)? */
export function isAllowedImageHost(url: string | null | undefined, allowedHosts: string[]): boolean {
  const host = imageHost(url);
  return !!host && allowedHosts.map((h) => h.toLowerCase()).includes(host);
}

/** Caminhos no storage. `hash` no nome evita cache antigo da CDN quando a imagem muda. */
export function stageImagePaths(stageId: string, hash: string): { cover: string; thumb: string } {
  const safeId = stageId.replace(/[^a-zA-Z0-9_-]/g, "");
  const h = hash.replace(/[^a-f0-9]/g, "").slice(0, 10);
  return { cover: `stages/${safeId}/cover-${h}.webp`, thumb: `stages/${safeId}/thumb-${h}.webp` };
}

/** Parâmetros de otimização (ver docs/admin.md). */
export const STAGE_IMAGE = {
  cover: { maxSide: 800, quality: 78 },
  thumb: { width: 400, height: 300, quality: 70 },
  maxDownloadBytes: 15 * 1024 * 1024,
} as const;
