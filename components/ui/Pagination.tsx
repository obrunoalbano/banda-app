import Link from "next/link";

export const PAGE_SIZE = 50;

/** Lê `?pagina=N` (1-based). Inválido → 1. */
export function parsePage(raw: string | string[] | undefined): number {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/** `skip`/`take` do Prisma para a página. */
export function pageArgs(page: number, pageSize = PAGE_SIZE) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * Paginação por links (mantém os filtros da URL).
 * `searchParams` = filtros atuais, sem `pagina`.
 */
export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  basePath,
  searchParams,
}: {
  page: number;
  total: number;
  pageSize?: number;
  basePath: string;
  searchParams?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams(searchParams);
    if (p > 1) qs.set("pagina", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const linkCls =
    "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800";
  const disabledCls =
    "rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600";

  return (
    <nav
      aria-label="Paginação"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-400"
    >
      <span>
        {from}–{to} de {total}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={linkCls} rel="prev">
            ← Anterior
          </Link>
        ) : (
          <span className={disabledCls}>← Anterior</span>
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className={linkCls} rel="next">
            Próxima →
          </Link>
        ) : (
          <span className={disabledCls}>Próxima →</span>
        )}
      </div>
    </nav>
  );
}
