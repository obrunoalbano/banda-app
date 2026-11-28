"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Icon } from "./icons";
import { cx, menuItemClass } from "./styles";

/**
 * Menu suspenso (padrão "menu button" do WAI-ARIA): botão com `aria-haspopup="menu"` que abre
 * uma lista de ações. Abre com clique, Enter, Espaço ou seta para baixo (foco no 1º item);
 * setas/Home/End navegam; Esc fecha e devolve o foco ao botão; Tab, clique fora ou escolher
 * um item fecham. Itens: `DropdownMenuLink`, `DropdownMenuSeparator`, `DropdownMenuHeader` ou
 * qualquer botão com `role="menuitem"` e `menuItemClass` (ex.: Sair, que é um <form>).
 */
export function DropdownMenu({
  label,
  trigger,
  triggerClassName,
  align = "start",
  children,
}: {
  /** Nome acessível do botão (ex.: "Menu da conta de Ana"). */
  label: string;
  /** Conteúdo visual do botão (ex.: avatar). */
  trigger: React.ReactNode;
  triggerClassName?: string;
  /** Lado em que o painel se alinha ao botão. */
  align?: "start" | "end";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const items = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  const focusItem = (index: number) => {
    const list = items();
    if (list.length) list[(index + list.length) % list.length].focus();
  };

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }

  // Ao abrir, foco no primeiro item (teclado e leitor de tela já caem dentro do menu).
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  // Clique/toque fora fecha (sem devolver o foco: a pessoa foi para outro lugar).
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function onPanelKeyDown(e: React.KeyboardEvent) {
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusItem(index + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusItem(index - 1);
        break;
      case "Home":
        e.preventDefault();
        focusItem(0);
        break;
      case "End":
        e.preventDefault();
        focusItem(list.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label={label}
          onKeyDown={onPanelKeyDown}
          // Escolher um item fecha o menu. Exceção: botão de envio de <form> (ex.: Sair) — fechar
          // desmontaria o form antes do envio e o navegador o cancelaria; a página muda em seguida.
          onClick={(e) => {
            const item = (e.target as HTMLElement).closest<HTMLElement>('[role="menuitem"]');
            if (item && !(item instanceof HTMLButtonElement && item.type === "submit")) setOpen(false);
          }}
          className={cx(
            "absolute top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface p-1.5 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** Item de menu que navega (Link do Next). */
export function DropdownMenuLink({ href, icon: ItemIcon, children }: { href: string; icon?: Icon; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" tabIndex={-1} className={menuItemClass}>
      {ItemIcon ? <ItemIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden /> : null}
      {children}
    </Link>
  );
}

export function DropdownMenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-line" />;
}

/** Cabeçalho informativo do menu (ex.: nome e email da conta). Não é focável. */
export function DropdownMenuHeader({ children }: { children: React.ReactNode }) {
  return (
    <div role="presentation" className="px-2.5 pb-2 pt-1.5">
      {children}
    </div>
  );
}
