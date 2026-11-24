import { Suspense } from "react";
import { ButtonLink } from "./Button";
import { Button } from "./Button";
import { FilterDisclosure } from "./FilterDisclosure";

/**
 * Barra de filtros de listagem: `<form method="get">` (estado na URL, funciona sem JS).
 * Filhos = campos (`<FilterField>`); ações padrão Aplicar/Limpar + extras.
 * No celular fica recolhida atrás do botão "Filtros (n)" (`FilterDisclosure`).
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
  const form = (
    <form
      method="get"
      role="search"
      aria-label="Filtros"
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface-muted p-4 sm:flex-row sm:flex-wrap sm:items-end"
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
  // Sem JS / antes de hidratar (Suspense do useSearchParams): o formulário aparece aberto.
  return (
    <Suspense fallback={<div className="mb-6">{form}</div>}>
      <FilterDisclosure>{form}</FilterDisclosure>
    </Suspense>
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
