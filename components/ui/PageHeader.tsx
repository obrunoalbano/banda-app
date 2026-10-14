import Link from "next/link";
import { BackIcon } from "./icons";
import { subtleLinkClass } from "./styles";

type PageHeaderProps = {
  /** Único <h1> da página. */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Rótulo da seção-mãe acima do título (sub-páginas de menu, ex.: "Integrações"). */
  eyebrow?: string;
  /** Link "Voltar…" acima do título (telas de detalhe/edição). */
  back?: { href: string; label: string };
  /** Botões à direita (no máx. 1 `primary`). */
  actions?: React.ReactNode;
  /** Conteúdo abaixo do título (ex.: badge de status). */
  children?: React.ReactNode;
};

export function PageHeader({ title, description, eyebrow, back, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className={`mb-3 inline-flex items-center gap-1 ${subtleLinkClass}`}>
            <BackIcon className="size-4" aria-hidden />
            {back.label}
          </Link>
        ) : null}
        {eyebrow ? <p className="mb-1 text-sm font-medium text-fg-subtle">{eyebrow}</p> : null}
        <h1 className="break-words text-2xl font-semibold tracking-tight text-fg">{title}</h1>
        {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
        {children ? <div className="mt-2 flex flex-wrap gap-2">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}
