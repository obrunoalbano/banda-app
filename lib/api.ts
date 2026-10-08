import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBandSession } from "@/lib/session";

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

type BandContext<P> = { bandId: string; params: P };

/**
 * Envolve um route handler autenticado: resolve a sessão (401 se ausente) e os `params`.
 * Uso: `export const GET = withBand(async (request, { bandId, params }) => { ... })`.
 */
export function withBand<P = Record<string, never>>(
  handler: (request: Request, ctx: BandContext<P>) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<P> }) => {
    const session = await requireBandSession();
    if (!session) return jsonError(401, "Não autorizado");
    const params = context?.params ? await context.params : ({} as P);
    return handler(request, { bandId: session.bandId, params });
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
