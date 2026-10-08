/**
 * Rate limit em memória (janela fixa por chave).
 *
 * Limitação: o estado é por instância. Em serverless (Vercel) cada instância tem o próprio
 * contador, então isso freia abuso casual/brute force simples, mas não é um limite global.
 * Para limite global, trocar a implementação por Redis/Upstash mantendo a mesma assinatura.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Ainda cheio (ataque com muitas chaves): descarta tudo em vez de crescer sem limite.
  if (buckets.size >= MAX_KEYS) buckets.clear();
}

/** Só para testes. */
export function resetRateLimits() {
  buckets.clear();
}

export const RATE_LIMITS = {
  /** Tentativas de login por email+IP. */
  login: { limit: 10, windowMs: 15 * 60_000 },
  /** Cadastros por IP. */
  register: { limit: 5, windowMs: 60 * 60_000 },
  /** Leads recebidos por token. */
  leadIngest: { limit: 60, windowMs: 60_000 },
} as const;
