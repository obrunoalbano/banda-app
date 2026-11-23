import { NextResponse } from "next/server";
import { z } from "zod";
import type { BandRole } from "@/app/generated/prisma/enums";
import { requireAdminSession, requireBandSession, requireUserSession } from "@/lib/session";

/** Resposta de erro padrão da API: `{ error }` em pt-BR (+ `details` opcional). */
export function jsonError(
  status: number,
  error: string,
  init?: { details?: unknown; headers?: HeadersInit },
) {
  return NextResponse.json(
    init?.details === undefined ? { error } : { error, details: init.details },
    { status, headers: init?.headers },
  );
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

/** Lê o JSON do corpo e valida com o schema. Em falha devolve a resposta 400 pronta. */
export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S,
  options?: { normalize?: (input: unknown) => unknown; headers?: HeadersInit },
): Promise<ParseResult<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonError(400, "JSON inválido", { headers: options?.headers }) };
  }
  const parsed = schema.safeParse(options?.normalize ? options.normalize(body) : body);
  if (!parsed.success) {
    return { ok: false, response: zodError(parsed.error, options?.headers) };
  }
  return { ok: true, data: parsed.data };
}

export function zodError(error: z.ZodError, headers?: HeadersInit) {
  return jsonError(400, "Dados inválidos", { details: z.flattenError(error), headers });
}

type BandContext<P> = { bandId: string; userId: string; role: BandRole; params: P };

/**
 * Envolve um route handler da banda ativa: resolve a sessão (401 se ausente/sem banda) e os `params`.
 * Por padrão só ADMINISTRADORES da banda passam (403 para visualizador) — toda rota de escrita
 * fica protegida sem precisar lembrar. `{ viewer: true }` libera leitura para visualizadores.
 * Uso: `export const PATCH = withBand(async (request, { bandId, params }) => { ... })`.
 */
export function withBand<P = Record<string, never>>(
  handler: (request: Request, ctx: BandContext<P>) => Promise<Response>,
  options: { viewer?: boolean } = {},
) {
  return async (request: Request, context: { params: Promise<P> }) => {
    const session = await requireBandSession();
    if (!session) return jsonError(401, "Não autorizado");
    if (!session.canEdit && !options.viewer) {
      return jsonError(403, "Apenas administradores da banda podem fazer alterações.");
    }
    const params = context?.params ? await context.params : ({} as P);
    return handler(request, { bandId: session.bandId, userId: session.userId, role: session.role, params });
  };
}

type UserContext<P> = { userId: string; params: P };

/** Rotas da CONTA (independem da banda ativa): perfil, senha, criar/trocar banda, aceitar convite. */
export function withUser<P = Record<string, never>>(
  handler: (request: Request, ctx: UserContext<P>) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<P> }) => {
    const session = await requireUserSession();
    if (!session) return jsonError(401, "Não autorizado");
    const params = context?.params ? await context.params : ({} as P);
    return handler(request, { userId: session.userId, params });
  };
}

type AdminContext<P> = { adminId: string; params: P };

/** Como `withBand`, para rotas do painel (`/api/admin/*`): exige superadmin ativo (403 caso contrário). */
export function withAdmin<P = Record<string, never>>(
  handler: (request: Request, ctx: AdminContext<P>) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<P> }) => {
    const session = await requireAdminSession();
    if (!session) return jsonError(403, "Acesso restrito à equipe.");
    const params = context?.params ? await context.params : ({} as P);
    return handler(request, { adminId: session.adminId, params });
  };
}

/** Violação de unique constraint do Prisma (P2002), ex.: email já cadastrado. */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
