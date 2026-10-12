/**
 * Regras das imagens de palco. Servimos SÓ a miniatura otimizada no nosso storage
 * (`imageThumbUrl`, WebP 400×300); `imageUrl` guarda o link de ORIGEM (nunca exibido), usado
 * para (re)processar. Módulo PURO — usado pelos scripts de importação/migração; coberto por teste.
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

/** Caminho da miniatura no storage. `hash` no nome evita cache antigo da CDN quando a imagem muda. */
export function stageThumbPath(stageId: string, hash: string): string {
  const safeId = stageId.replace(/[^a-zA-Z0-9_-]/g, "");
  const h = hash.replace(/[^a-f0-9]/g, "").slice(0, 10);
  return `stages/${safeId}/thumb-${h}.webp`;
}

/** Parâmetros de otimização (ver docs/admin.md §6.1). */
export const STAGE_IMAGE = {
  thumb: { width: 400, height: 300, quality: 72 },
  maxDownloadBytes: 15 * 1024 * 1024,
} as const;
