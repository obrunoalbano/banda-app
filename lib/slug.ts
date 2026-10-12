/**
 * Slug público da banda (URL da agenda: /b/<slug>).
 * Formato: minúsculas, sem acento, palavras separadas por hífen. 3–50 caracteres.
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 50;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Caminhos que não podem virar slug (evita confusão com rotas/sistema). */
const RESERVED = new Set([
  "admin", "api", "app", "b", "banda", "bandas", "cadastro", "casas", "contatos", "design-system",
  "embed", "integracoes", "login", "logout", "public", "shows", "suporte", "www",
]);

/** "Os Incríveis & Cia." → "os-incriveis-cia" (limitado a SLUG_MAX). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

/** Mensagem de erro em pt-BR, ou `null` se o slug é válido. */
export function slugError(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Use pelo menos ${SLUG_MIN} caracteres.`;
  if (slug.length > SLUG_MAX) return `Use no máximo ${SLUG_MAX} caracteres.`;
  if (!SLUG_PATTERN.test(slug)) return "Use só letras minúsculas, números e hífens (ex.: os-incriveis).";
  if (RESERVED.has(slug)) return "Este endereço é reservado. Escolha outro.";
  return null;
}

/** Slug base para uma banda nova (nunca vazio, nunca reservado, mínimo garantido). */
export function baseSlugFor(name: string): string {
  let slug = slugify(name);
  if (slug.length < SLUG_MIN || RESERVED.has(slug)) slug = slug ? `banda-${slug}` : "banda";
  return slug.slice(0, SLUG_MAX);
}

/** Candidatos em ordem: base, base-2, base-3… (o sufixo cabe em SLUG_MAX). */
export function slugCandidate(base: string, attempt: number): string {
  if (attempt <= 1) return base;
  const suffix = `-${attempt}`;
  return `${base.slice(0, SLUG_MAX - suffix.length).replace(/-+$/g, "")}${suffix}`;
}
