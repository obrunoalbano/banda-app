import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Garante contraste WCAG AA dos tokens de app/globals.css nos dois temas.
 * Se este teste falhar após mudar uma cor, ajuste o token — não o limite.
 */

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
const [lightPart, darkAndRest] = css.split("@media (prefers-color-scheme: dark)");
const darkPart = darkAndRest.split("@theme")[0];

function readTokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

const themes = {
  claro: readTokens(lightPart),
  escuro: { ...readTokens(lightPart), ...readTokens(darkPart) },
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** [texto, fundo, mínimo]. Texto normal 4.5:1; anel de foco (não-texto) 3:1. */
const PAIRS: [string, string, number][] = [
  ["fg", "canvas", 4.5],
  ["fg", "surface-muted", 4.5],
  ["fg-muted", "canvas", 4.5],
  ["fg-muted", "surface-muted", 4.5],
  ["fg-subtle", "canvas", 4.5],
  ["fg-subtle", "surface-muted", 4.5],
  ["fg-subtle", "surface-sunken", 4.5],
  ["on-primary", "primary", 4.5],
  ["on-primary", "primary-hover", 4.5],
  ["on-danger", "danger", 4.5],
  ["on-danger", "danger-hover", 4.5],
  ["neutral-fg", "neutral-bg", 4.5],
  ["info-fg", "info-bg", 4.5],
  ["success-fg", "success-bg", 4.5],
  ["warning-fg", "warning-bg", 4.5],
  ["danger-fg", "danger-bg", 4.5],
  ["focus", "canvas", 3],
];

describe.each(Object.entries(themes))("tokens do tema %s", (_name, tokens) => {
  it.each(PAIRS)("%s sobre %s ≥ %s:1", (fg, bg, min) => {
    expect(tokens[fg], `token --${fg} não encontrado`).toBeDefined();
    expect(tokens[bg], `token --${bg} não encontrado`).toBeDefined();
    expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
  });
});
