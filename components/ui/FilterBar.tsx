import { ButtonLink } from "./Button";
import { Button } from "./Button";

/**
 * Barra de filtros de listagem: `<form method="get">` (estado na URL, funciona sem JS).
 * Filhos = campos (`<FilterField>`); ações padrão Aplicar/Limpar + extras.
 */
export function FilterBar({
  clearHref,
  extraActions,
  children,
}: {
  /** URL sem filtros (botão "Limpar"). */
  clearHref: string;
  extraActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <form
      method="get"
      role="search"
      aria-label="Filtros"
      className="mb-6 flex flex-col gap-3 rounded-lg border border-line bg-surface-muted p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {children}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Aplicar</Button>
        {extraActions}
        <ButtonLink href={clearHref} variant="ghost">
          Limpar
        </ButtonLink>
      </div>
    </form>
  );
}

/** Campo de filtro (label pequeno + select/input não controlado). */
export function FilterField({
  id,
  label,
  minWidth = 180,
  children,
}: {
  id: string;
  label: string;
  minWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1" style={{ minWidth }}>
      <label htmlFor={id} className="text-xs font-medium text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  );
}
