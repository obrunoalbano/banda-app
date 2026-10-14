"use client";

import { useEffect, useId, useRef } from "react";
import { CloseIcon } from "./icons";
import { iconButtonClass } from "./styles";

/**
 * Painel lateral modal (<dialog> nativo: foco preso, Esc fecha). Detalhes de um item sem sair
 * da tela (ex.: card do Fluxo de contatos). Ocupa a tela no mobile; à direita no desktop.
 * Fecha por Esc, botão X ou clique fora.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();

  // Sincroniza a cada render: se o <dialog> fechar por fora do estado, o próximo `open` reabre.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Foco no título, não no botão Fechar: o Enter que abriu o painel (teclado) não pode fechá-lo.
      headingRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  });

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      // Esc passa pelo estado do pai (em vez de fechar o <dialog> por conta própria). Não ouvir o
      // evento "close": ele chega numa tarefa posterior e fecharia um painel já reaberto.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Clique no backdrop = clique no próprio <dialog> (o conteúdo fica num filho).
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-full border-l border-line bg-surface p-0 text-fg shadow-xl backdrop:bg-overlay sm:max-w-lg"
    >
      {open ? (
        <div className="flex min-h-full flex-col">
          <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
            <div className="min-w-0">
              <h2 id={titleId} ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-fg focus:outline-none">
                {title}
              </h2>
              {description ? <div className="mt-1 text-sm text-fg-muted">{description}</div> : null}
            </div>
            <button type="button" onClick={onClose} className={iconButtonClass("sm")} aria-label="Fechar">
              <CloseIcon className="size-4" aria-hidden />
            </button>
          </header>
          <div className="flex flex-1 flex-col gap-6 px-5 py-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  );
}
