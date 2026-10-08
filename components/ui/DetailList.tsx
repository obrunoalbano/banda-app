/** Lista de detalhes (<dl>) em grid de 2 colunas. */
export function DetailList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={`grid gap-4 sm:grid-cols-2 ${className ?? "max-w-xl"}`}>{children}</dl>;
}

/** Item da lista. Valor vazio (`null`/`undefined`/"") mostra "—". */
export function DetailItem({
  label,
  children,
  wide,
  preserveLines,
}: {
  label: string;
  children?: React.ReactNode;
  /** Ocupa as duas colunas. */
  wide?: boolean;
  /** Mantém quebras de linha (textos longos). */
  preserveLines?: boolean;
}) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd
        className={`mt-1 break-words text-zinc-900 dark:text-zinc-100 ${preserveLines ? "whitespace-pre-wrap" : ""}`}
      >
        {empty ? <span className="text-zinc-500">—</span> : children}
      </dd>
    </div>
  );
}

/** Link externo (mailto:, wa.me, Instagram) com o texto original. */
export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-900 dark:hover:decoration-zinc-100"
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}
