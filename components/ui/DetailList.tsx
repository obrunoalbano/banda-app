import type { Icon } from "./icons";
import { ExternalLinkIcon } from "./icons";
import { cx } from "./styles";

/** Lista de detalhes (<dl>) em grid de 2 colunas. */
export function DetailList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cx("grid gap-x-6 gap-y-5 sm:grid-cols-2", className ?? "max-w-xl")}>{children}</dl>;
}

/** Item da lista. Valor vazio (`null`/`undefined`/"") mostra "—". */
export function DetailItem({
  label,
  children,
  wide,
  preserveLines,
  numeric,
}: {
  label: string;
  children?: React.ReactNode;
  /** Ocupa as duas colunas. */
  wide?: boolean;
  /** Mantém quebras de linha (textos longos). */
  preserveLines?: boolean;
  /** Valores numéricos (dinheiro, datas) com algarismos alinhados. */
  numeric?: boolean;
}) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{label}</dt>
      <dd
        className={cx(
          "mt-1 break-words text-fg",
          preserveLines && "whitespace-pre-wrap",
          numeric && "tabular",
        )}
      >
        {empty ? <span className="text-fg-subtle">—</span> : children}
      </dd>
    </div>
  );
}

/** Link de contato/externo (mailto:, wa.me, Instagram) com ícone opcional. */
export function ExternalLink({
  href,
  icon: IconCmp,
  children,
}: {
  href: string;
  icon?: Icon;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 underline decoration-line-strong underline-offset-2 hover:decoration-fg"
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {IconCmp ? <IconCmp className="size-4 shrink-0 text-fg-subtle" aria-hidden /> : null}
      {children}
      {external ? (
        <>
          <ExternalLinkIcon className="size-3 shrink-0 text-fg-subtle" aria-hidden />
          <span className="sr-only">(abre em nova aba)</span>
        </>
      ) : null}
    </a>
  );
}
