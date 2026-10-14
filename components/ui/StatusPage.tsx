import type { Icon } from "./icons";

/** Tela de estado (não encontrado, erro): ícone, título, explicação e ações. */
export function StatusPage({
  icon: IconCmp,
  title,
  description,
  actions,
}: {
  icon: Icon;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <IconCmp className="size-10 text-fg-subtle" aria-hidden strokeWidth={1.5} />
      <h1 className="mt-4 text-xl font-semibold text-fg">{title}</h1>
      {description ? <p className="mt-2 text-sm text-fg-muted">{description}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
