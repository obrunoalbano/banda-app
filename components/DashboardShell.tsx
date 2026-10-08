"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

/** Para nova seção: adicione aqui. `matchNova: false` evita marcar ativo em `/x/nova`. */
const NAV = [
  { href: "/casas", label: "Casas", short: "C", matchNova: false },
  { href: "/shows", label: "Shows", short: "S", matchNova: false },
  { href: "/integracoes", label: "Integrações", short: "I" },
  { href: "/contatos", label: "Contatos", short: "Co" },
  { href: "/banda", label: "Minha banda", short: "MB" },
] as const;

function navActive(pathname: string, item: (typeof NAV)[number]): boolean {
  if (pathname === item.href) return true;
  if (!pathname.startsWith(`${item.href}/`)) return false;
  if ("matchNova" in item && !item.matchNova) return !pathname.startsWith(`${item.href}/nova`);
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

  const linkBase = "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors";
  const linkIdle =
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
  const linkActive = "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        id="dashboard-nav"
        className={`fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-[width,transform] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${expanded ? "md:w-56" : "md:w-[3.25rem]"}`}
      >
        <div
          className={`flex h-12 items-center gap-1 border-b border-zinc-200 px-2 dark:border-zinc-800 ${expanded ? "justify-between" : "justify-center"}`}
        >
          {expanded ? (
            <span className="truncate pl-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Menu
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => (mobileOpen ? setMobileOpen(false) : writeCollapsed(!collapsed))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-expanded={expanded}
            aria-controls="dashboard-nav"
            aria-label={mobileOpen ? "Fechar menu" : expanded ? "Recolher menu" : "Expandir menu"}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              {expanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5 p-2">
          {NAV.map((item) => {
            const active = navActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={`${linkBase} ${active ? linkActive : linkIdle} ${expanded ? "" : "justify-center px-0"}`}
              >
                {!expanded ? (
                  <span
                    className="flex min-h-8 min-w-8 max-w-[2.75rem] items-center justify-center rounded-md px-0.5 text-center text-[0.65rem] font-semibold leading-tight"
                    aria-hidden
                  >
                    {item.short}
                  </span>
                ) : null}
                <span className={expanded ? "truncate" : "sr-only"}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div
          className={`mt-auto border-t border-zinc-200 p-2 dark:border-zinc-800 ${expanded ? "" : "flex flex-col items-center gap-2"}`}
        >
          {expanded && userName ? (
            <Link
              href="/banda"
              className="mb-2 block truncate px-1 text-xs text-zinc-500 dark:text-zinc-400"
              title={userName}
            >
              {userName}
            </Link>
          ) : null}
          <div className={expanded ? "" : "flex justify-center"}>{footer}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
            aria-controls="dashboard-nav"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Marca, não título: o <h1> é de cada página. */}
          <Link href="/casas" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Banda
          </Link>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
