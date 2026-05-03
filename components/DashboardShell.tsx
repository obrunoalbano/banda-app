"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/casas", label: "Casas", short: "C" },
  // { href: "/casas/nova", label: "Nova casa", short: "NC" },
  { href: "/shows", label: "Shows", short: "S" },
  // { href: "/shows/nova", label: "Novo show", short: "NS" },
  { href: "/integracoes", label: "Integrações", short: "I" },
  { href: "/contatos", label: "Contatos", short: "Co" },
  { href: "/banda", label: "Minha banda", short: "MB" },
] as const;

function navActive(pathname: string, href: string): boolean {
  if (href === "/casas")
    return pathname === "/casas" || /^\/casas\/(?!nova)/.test(pathname);
  if (href === "/shows")
    return pathname === "/shows" || /^\/shows\/(?!nova)/.test(pathname);
  if (href === "/contatos") return pathname === "/contatos" || pathname.startsWith("/contatos/");
  if (href === "/integracoes") return pathname === "/integracoes" || pathname.startsWith("/integracoes/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

type DashboardShellProps = {
  userName?: string | null;
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({ userName, footer, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  const asideWidth = expanded ? "w-56" : "w-[3.25rem]";

  const linkBase =
    "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors";
  const linkIdle =
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";
  const linkActive =
    "bg-zinc-200 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50";

  return (
    <div className="flex min-h-screen">
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 transition-[width] duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950 ${asideWidth}`}
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
            onClick={() => setExpanded((e) => !e)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-expanded={expanded}
            aria-label={expanded ? "Recolher menu" : "Expandir menu"}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden
            >
              {expanded ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`${linkBase} ${active ? linkActive : linkIdle} ${expanded ? "" : "justify-center px-0"}`}
              >
                {!expanded ? (
                  <span className="flex min-h-8 min-w-8 max-w-[2.75rem] items-center justify-center rounded-md px-0.5 text-center text-[0.65rem] font-semibold leading-tight">
                    {item.short}
                  </span>
                ) : (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={`mt-auto border-t border-zinc-200 p-2 dark:border-zinc-800 ${expanded ? "" : "flex flex-col items-center gap-2"}`}
        >
          {expanded && userName ? (
            <Link href="/banda" className="mb-2 truncate px-1 text-xs text-zinc-500 dark:text-zinc-400" title={userName}>
              {userName}
            </Link>
          ) : null}
          <div className={expanded ? "" : "flex justify-center"}>{footer}</div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Banda
          </h1>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
