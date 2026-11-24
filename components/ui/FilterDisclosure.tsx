"use client";

import { useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { FilterIcon, NextIcon } from "./icons";
import { cx } from "./styles";

/** Parâmetros da URL que não são filtro (paginação, origem do app instalado). */
const NOT_FILTERS = new Set(["page", "pagina", "origem"]);

/**
 * Filtros recolhidos no celular: um botão "Filtros (n)" abre/fecha o formulário, que no desktop
 * fica sempre visível. Economiza meia tela antes da lista em telas pequenas.
 */
export function FilterDisclosure({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const active = [...params.entries()].filter(([k, v]) => v && !NOT_FILTERS.has(k)).length;
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex h-11 w-full items-center gap-2 rounded-lg border border-line bg-surface-muted px-4 text-sm font-medium text-fg sm:hidden"
      >
        <FilterIcon className="size-4 text-fg-subtle" aria-hidden />
        Filtros
        {active ? (
          <span className="rounded-full bg-primary px-1.5 text-xs leading-5 text-on-primary">{active}</span>
        ) : null}
        <NextIcon className={cx("ml-auto size-4 text-fg-subtle transition-transform", open && "rotate-90")} aria-hidden />
      </button>
      <div id={panelId} className={cx(open ? "mt-2" : "hidden", "sm:mt-0 sm:block")}>
        {children}
      </div>
    </div>
  );
}
