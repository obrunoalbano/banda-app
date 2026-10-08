import Link from "next/link";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Link "← Voltar…" acima do título (telas de detalhe/edição). */
  back?: { href: string; label: string };
  /** Botões/links à direita do título. */
  actions?: React.ReactNode;
  /** Conteúdo abaixo do título (ex.: badge de status). */
  children?: React.ReactNode;
};

export function PageHeader({ title, description, back, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link
            href={back.href}
            className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          >
            ← {back.label}
          </Link>
        ) : null}
        <h1 className="break-words text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        ) : null}
        {children ? <div className="mt-2">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
