#!/usr/bin/env node
/**
 * Gera os ícones do app instalável (PWA) a partir de um SVG único:
 *   public/icons/icon-192.png, icon-512.png (ícone "any"),
 *   public/icons/maskable-512.png (Android: margem de segurança para recorte em círculo/squircle),
 *   app/apple-icon.png (180×180, tela de início do iPhone — convenção de arquivo do Next).
 * Uso: node scripts/generate-pwa-icons.mjs   (os PNGs gerados são versionados)
 */
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const BG = "#18181b"; // mesmo tom do --primary claro (zinc-900)
const FG = "#fafafa";

/** Marca: "b" minúsculo (de "banda") — legível em 48px. `scale` encolhe o desenho (maskable). */
function svg({ size, radius, scale = 1 }) {
  const s = size;
  const c = s / 2;
  const k = (s / 512) * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${radius}" fill="${BG}"/>
  <g transform="translate(${c} ${c}) scale(${k}) translate(-256 -256)" fill="${FG}">
    <!-- "b": haste + bojo (anel) -->
    <g transform="translate(-12 0)">
      <path d="M136 120a32 32 0 0 1 64 0V420H136z"/>
      <path fill-rule="evenodd" d="M288 196a112 112 0 1 1 0 224a112 112 0 1 1 0-224zM288 256a52 52 0 1 0 0 104a52 52 0 1 0 0-104z"/>
    </g>
  </g>
</svg>`;
}

async function png(file, opts) {
  await sharp(Buffer.from(svg(opts)))
    .png()
    .toFile(file);
  console.log("✓", file);
}

await mkdir("public/icons", { recursive: true });
await png("public/icons/icon-192.png", { size: 192, radius: 40 });
await png("public/icons/icon-512.png", { size: 512, radius: 108 });
// Maskable: fundo cheio (sem cantos) e desenho dentro da zona segura (80% central).
await png("public/icons/maskable-512.png", { size: 512, radius: 0, scale: 0.72 });
// iOS aplica a própria máscara: fundo cheio, sem cantos.
await png("app/apple-icon.png", { size: 180, radius: 0, scale: 0.9 });
