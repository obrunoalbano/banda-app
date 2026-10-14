/**
 * Origens (scheme://host[:porta]) autorizadas a enviar o formulário de contato pelo navegador.
 * A banda digita do jeito que lembra ("meusite.com.br", "https://www.site.com/contato");
 * guardamos só a origem normalizada.
 */

export const MAX_ALLOWED_ORIGINS = 10;

/** "meusite.com.br" → "https://meusite.com.br". Inválido → null. Só http(s); http só para localhost. */
export function normalizeOrigin(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol === "http:" && !isLocal) return null;
  // Exige domínio com ponto (ou localhost) — evita "https://meusite" por engano.
  if (!isLocal && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname)) return null;
  return url.origin.toLowerCase();
}
