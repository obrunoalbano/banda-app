import { ButtonLink } from "./Button";
import { NextIcon, PrevIcon } from "./icons";
import { buttonClass } from "./styles";

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
  const disabled = `${buttonClass("secondary", "sm")} pointer-events-none opacity-50`;

  return (
    <nav aria-label="Paginação" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-fg-muted">
      <span className="tabular">
        {from}–{to} de {total}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <ButtonLink href={href(page - 1)} variant="secondary" size="sm" icon={PrevIcon} rel="prev">
            Anterior
          </ButtonLink>
        ) : (
          <span className={disabled} aria-disabled="true">
            <PrevIcon aria-hidden />
            Anterior
          </span>
        )}
        {page < pages ? (
          <ButtonLink href={href(page + 1)} variant="secondary" size="sm" rel="next">
            Próxima
            <NextIcon aria-hidden />
          </ButtonLink>
        ) : (
          <span className={disabled} aria-disabled="true">
            Próxima
            <NextIcon aria-hidden />
          </span>
        )}
      </div>
    </nav>
  );
}
