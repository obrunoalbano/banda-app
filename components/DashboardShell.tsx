"use client";

import { Brand } from "@/components/ui/Brand";
import {
  BandIcon,
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  IntegrationIcon,
  LeadIcon,
  MenuIcon,
  ShowIcon,
  VenueIcon,
  type Icon,
} from "@/components/ui/icons";
import { cx, iconButtonClass } from "@/components/ui/styles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  /** `false` evita marcar ativo em `/x/nova` (a página "nova" não pertence ao item). */
  matchNova?: boolean;
};

/** Navegação: conteúdo do dia a dia primeiro, configurações separadas embaixo. */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Gestão",
    items: [
      { href: "/casas", label: "Casas", icon: VenueIcon, matchNova: false },
      { href: "/shows", label: "Shows", icon: ShowIcon, matchNova: false },
      { href: "/contatos", label: "Contatos", icon: LeadIcon },
    ],
  },
  {
    label: "Configurações",
    items: [
      { href: "/integracoes", label: "Integrações", icon: IntegrationIcon },
      { href: "/banda", label: "Minha banda", icon: BandIcon },
    ],
  },
];

function navActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (!pathname.startsWith(`${item.href}/`)) return false;
  if (item.matchNova === false) return !pathname.startsWith(`${item.href}/nova`);
  return true;
}

/* Preferência "menu recolhido" no localStorage (try/catch: modo privado pode bloquear). */
const STORAGE_KEY = "banda:sidebar-collapsed";
const listeners = new Set<() => void>();
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // ignora: preferência só não persiste
  }
  listeners.forEach((l) => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type DashboardShellProps = {
  userName?: string | null;
  /** Rodapé do menu (botão Sair). Use `group-data-[collapsed=true]:…` para adaptar ao menu recolhido. */
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({ userName, footer, children }: DashboardShellProps) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);

  // Fecha a gaveta mobile ao navegar (ajuste de estado durante o render, sem effect).
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Na gaveta mobile o menu é sempre expandido.
  const expanded = mobileOpen || !collapsed;

  return (
    <div className="flex min-h-screen">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Pular para o conteúdo
      </a>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-overlay md:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}

      <aside
        id="dashboard-nav"
        data-collapsed={!expanded}
        className={cx(
          "group fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-line bg-surface-muted transition-[width,transform] duration-200 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          expanded ? "md:w-60" : "md:w-16",
        )}
      >
        <div className={cx("flex h-14 items-center border-b border-line px-3", expanded ? "justify-between" : "justify-center")}>
          {expanded ? <Brand href="/casas" /> : null}
          <button
            type="button"
            onClick={() => (mobileOpen ? setMobileOpen(false) : writeCollapsed(!collapsed))}
            className={iconButtonClass("sm")}
            aria-expanded={expanded}
            aria-controls="dashboard-nav"
            aria-label={mobileOpen ? "Fechar menu" : expanded ? "Recolher menu" : "Expandir menu"}
            title={mobileOpen ? "Fechar menu" : expanded ? "Recolher menu" : "Expandir menu"}
          >
            {mobileOpen ? <CloseIcon aria-hidden /> : expanded ? <CollapseIcon aria-hidden /> : <ExpandIcon aria-hidden />}
          </button>
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {expanded ? (
                <p className="mb-1 px-2.5 text-xs font-medium uppercase tracking-wide text-fg-subtle">{group.label}</p>
              ) : (
                <hr className="mx-2 mb-2 border-line" aria-hidden />
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = navActive(pathname, item);
                  const ItemIcon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={expanded ? undefined : item.label}
                        aria-current={active ? "page" : undefined}
                        className={cx(
                          "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
                          active
                            ? "bg-surface-sunken font-medium text-fg"
                            : "text-fg-muted hover:bg-surface-sunken hover:text-fg",
                          !expanded && "justify-center px-0",
                        )}
                      >
                        <ItemIcon className={cx("size-5 shrink-0", active ? "text-fg" : "text-fg-subtle")} aria-hidden />
                        <span className={expanded ? "truncate" : "sr-only"}>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={cx("border-t border-line p-3", !expanded && "flex flex-col items-center")}>
          {expanded && userName ? (
            <Link
              href="/banda"
              className="mb-2 block truncate px-2.5 text-xs text-fg-subtle hover:text-fg"
              title={userName}
            >
              {userName}
            </Link>
          ) : null}
          {footer}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior só no mobile: abre a gaveta. No desktop o menu lateral já mostra a marca. */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-4 md:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className={cx(iconButtonClass("md"), "-ml-2")}
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            aria-controls="dashboard-nav"
          >
            <MenuIcon aria-hidden />
          </button>
          <Brand href="/casas" />
        </header>
        <main id="conteudo" className="min-h-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
