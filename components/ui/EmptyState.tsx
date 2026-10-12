import { ButtonLink } from "./Button";
import type { Icon } from "./icons";
import { AddIcon } from "./icons";

/**
 * Estado vazio de listagem. Diga o que está vazio e ofereça o próximo passo.
 * `action.primary` = criar o primeiro item (botão); senão, link discreto (ex.: "Limpar filtros").
 */
export function EmptyState({
  icon: IconCmp,
  title,
  description,
  action,
}: {
  icon?: Icon;
  title: string;
  description?: React.ReactNode;
  action?: { href: string; label: string; primary?: boolean };
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-12 text-center">
      {IconCmp ? <IconCmp className="size-10 text-fg-subtle" aria-hidden strokeWidth={1.5} /> : null}
      <p className="mt-3 text-sm font-medium text-fg">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p> : null}
      {action ? (
        <ButtonLink
          href={action.href}
          variant={action.primary ? "primary" : "secondary"}
          icon={action.primary ? AddIcon : undefined}
          className="mt-5"
        >
          {action.label}
        </ButtonLink>
      ) : null}
    </div>
  );
}
