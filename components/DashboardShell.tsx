"use client";

import { InstallAppButton } from "@/components/InstallAppButton";
import { Brand } from "@/components/ui/Brand";
import {
  AiIcon,
  BandIcon,
  CloseIcon,
  EpkIcon,
  ExploreIcon,
  FinanceEntryIcon,
  FinanceIcon,
  ShieldIcon,
  SocialIcon,
  CollapseIcon,
  ExpandIcon,
  IntegrationIcon,
  DealIcon,
  LeadIcon,
  MenuIcon,
  RehearsalIcon,
  RepertoireIcon,
  ShowIcon,
  SwitchBandIcon,
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
  /** `false` evita marcar ativo em `/x/nova` ou `/x/novo` (a página de criar não pertence ao item). */
  matchNova?: boolean;
  /** Submenu (ex.: Integrações → Agenda, Contatos). O pai fica marcado quando um filho está ativo. */
  children?: { href: string; label: string; exact?: boolean }[];
  /** Ainda não disponível: aparece desabilitado com selo "Em breve" (sem link). */
  soon?: boolean;
  /** Ativo só na própria URL (quando outro item do menu é sub-rota dele, ex.: /financeiro × /financeiro/lancamentos). */
  exact?: boolean;
  /** Só para administradores da banda (visualizador não vê o item). */
  adminOnly?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  /** Módulo inteiro ainda não disponível (ex.: Financeiro): mostra só o título com "Em breve". */
  soon?: { icon: Icon };
};

/**
 * Navegação por módulos do produto. URLs não mudam com o módulo (só o agrupamento).
 * Recurso novo ainda não construído → `soon: true` (visível, desabilitado). Ao lançar, remova o `soon`.
 */
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Administrativo",
    items: [
      { href: "/casas", label: "Casas", icon: VenueIcon, matchNova: false },
      { href: "/shows", label: "Shows", icon: ShowIcon, matchNova: false },
      { href: "/ensaios", label: "Ensaios", icon: RehearsalIcon, matchNova: false },
      { href: "/repertorios", label: "Repertórios", icon: RepertoireIcon, matchNova: false },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/financeiro", label: "Visão geral", icon: FinanceIcon, exact: true },
      { href: "/financeiro/lancamentos", label: "Lançamentos", icon: FinanceEntryIcon },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/contatos", label: "Contatos", icon: LeadIcon },
      { href: "/fluxo", label: "Fluxo de contatos", icon: DealIcon },
      { href: "/redes-sociais", label: "Redes Sociais", icon: SocialIcon, soon: true },
      { href: "/epk", label: "EPK Profissional", icon: EpkIcon, soon: true },
      { href: "/explorar", label: "Explorar Palcos", icon: ExploreIcon },
      { href: "/abordagem", label: "Abordagem com IA", icon: AiIcon, soon: true },
    ],
  },
  {
    label: "Configurações",
    items: [
      {
        href: "/integracoes",
        label: "Integrações",
        icon: IntegrationIcon,
        adminOnly: true,
        children: [
          { href: "/integracoes/agenda", label: "Agenda" },
          { href: "/integracoes/contato", label: "Contatos" },
        ],
      },
      {
        href: "/banda",
        label: "Minha banda",
        icon: BandIcon,
        children: [
          // `exact`: /banda/integrantes também começa com /banda.
          { href: "/banda", label: "Dados da banda", exact: true },
          { href: "/banda/integrantes", label: "Integrantes" },
        ],
      },
    ],
  },
];

/** Menu do painel superadmin (/admin). Mesmas regras de NAV_GROUPS. */
const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    label: "Cadastros",
    items: [
      { href: "/admin/palcos", label: "Palcos", icon: ExploreIcon, matchNova: false },
      {
        href: "/admin/usuarios",
        label: "Usuários",
        icon: ShieldIcon,
        children: [
          { href: "/admin/usuarios/bandas", label: "Bandas" },
          { href: "/admin/usuarios/contas", label: "Contas" },
          { href: "/admin/usuarios/administradores", label: "Administradores" },
        ],
      },
    ],
  },
];

/** Configuração por área: o shell é o mesmo, muda menu, início e perfil. */
const VARIANTS = {
  band: { groups: NAV_GROUPS, home: "/casas", profile: "/conta", adminBadge: false },
  admin: { groups: ADMIN_NAV_GROUPS, home: "/admin/palcos", profile: "/admin/senha", adminBadge: true },
} as const;

/**
 * Barra de abas do celular (app da banda): atalhos para os módulos mais usados + "Menu" (gaveta
 * com tudo). Só no mobile; no desktop o menu lateral já está sempre visível.
 */
const MOBILE_TABS: { href: string; label: string; icon: Icon; match: string[] }[] = [
  { href: "/casas", label: "Casas", icon: VenueIcon, match: ["/casas"] },
  { href: "/shows", label: "Shows", icon: ShowIcon, match: ["/shows"] },
  { href: "/financeiro", label: "Financeiro", icon: FinanceIcon, match: ["/financeiro"] },
  { href: "/contatos", label: "Contatos", icon: LeadIcon, match: ["/contatos", "/fluxo"] },
];

function tabActive(pathname: string, match: string[]): boolean {
  return match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}

/** Marca o painel superadmin (sempre visível ao lado da marca). */
function AdminBadge() {
  return (
    <span className="shrink-0 rounded-full border border-info-line bg-info-bg px-1.5 text-[0.65rem] font-semibold uppercase leading-4 text-info-fg">
      Admin
    </span>
  );
}

/** Selo "Em breve" do menu. */
function SoonBadge() {
  return (
    <span className="ml-auto shrink-0 rounded-full border border-line px-1 text-[0.6rem] font-medium uppercase leading-4 text-fg-subtle">
      Em breve
    </span>
  );
}

function navActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.exact || !pathname.startsWith(`${item.href}/`)) return false;
  if (item.matchNova === false) {
    return !pathname.startsWith(`${item.href}/nova`) && !pathname.startsWith(`${item.href}/novo`);
  }
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

/** Banda ativa (app da banda). `null` = usuário ainda sem banda (página /bandas). */
export type ShellBand = {
  name: string;
  roleLabel: string;
  canEdit: boolean;
  /** Selos numéricos por item do menu (href → quantidade), ex.: ensaios sem resposta. */
  badges?: Record<string, number>;
} | null;

/** Banda ativa no topo do menu, com atalho para trocar/criar banda. */
function BandSwitcher({ band, expanded }: { band: NonNullable<ShellBand> | null; expanded: boolean }) {
  const label = band ? `${band.name} — trocar de banda` : "Escolher banda";
  if (!expanded) {
    return (
      <Link
        href="/bandas"
        title={label}
        aria-label={label}
        className="flex h-9 items-center justify-center rounded-md text-fg-muted hover:bg-surface-sunken hover:text-fg"
      >
        <SwitchBandIcon className="size-5" aria-hidden />
      </Link>
    );
  }
  return (
    <Link
      href="/bandas"
      title={label}
      className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2 hover:bg-surface-sunken"
    >
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-sm font-medium text-fg">{band ? band.name : "Nenhuma banda"}</span>
        <span className="truncate text-xs text-fg-subtle">{band ? band.roleLabel : "Escolha ou crie uma banda"}</span>
      </span>
      <SwitchBandIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      <span className="sr-only">Trocar de banda</span>
    </Link>
  );
}

type DashboardShellProps = {
  /** "admin" = painel superadmin (menu e links próprios, selo "Admin" na marca). */
  variant?: keyof typeof VARIANTS;
  userName?: string | null;
  /** App da banda: banda ativa (seletor no topo do menu; esconde itens só de administrador). */
  band?: ShellBand;
  /** Rodapé do menu (botão Sair). Use `group-data-[collapsed=true]:…` para adaptar ao menu recolhido. */
  footer: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({ variant = "band", userName, band = null, footer, children }: DashboardShellProps) {
  const config = VARIANTS[variant];
  const isBandApp = variant === "band";
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
  // Abas inferiores no celular: app da banda com banda ativa (o painel /admin tem poucos itens).
  const showTabs = isBandApp && !!band;

  return (
    <div className="flex min-h-dvh">
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
          "group fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] shrink-0 flex-col overscroll-contain border-r border-line bg-surface-muted pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pt-[env(safe-area-inset-top)] transition-[width,transform] duration-200 ease-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:p-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          expanded ? "md:w-64" : "md:w-16",
        )}
      >
        <div
          className={cx(
            "flex h-14 items-center border-b border-line px-3",
            expanded ? "justify-between" : "justify-center",
          )}
        >
          {expanded ? <Brand href={config.home} /> : null}
          <button
            type="button"
            onClick={() => (mobileOpen ? setMobileOpen(false) : writeCollapsed(!collapsed))}
            className={iconButtonClass("sm")}
            aria-expanded={expanded}
            aria-controls="dashboard-nav"
            aria-label={mobileOpen ? "Fechar menu" : expanded ? "Recolher menu" : "Expandir menu"}
            title={mobileOpen ? "Fechar menu" : expanded ? "Recolher menu" : "Expandir menu"}
          >
            {mobileOpen ? (
              <CloseIcon aria-hidden />
            ) : expanded ? (
              <CollapseIcon aria-hidden />
            ) : (
              <ExpandIcon aria-hidden />
            )}
          </button>
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-6 overflow-y-auto p-3">
          {config.adminBadge ? (
            // Deixa claro, o tempo todo, que esta é a área da equipe (não o app de uma banda).
            <p
              className={cx(
                "rounded-md border border-info-line bg-info-bg text-xs font-semibold text-info-fg",
                expanded ? "px-2.5 py-1.5" : "px-0 py-1 text-center",
              )}
            >
              {expanded ? "Painel administrativo" : "ADM"}
            </p>
          ) : null}
          {isBandApp ? <BandSwitcher band={band} expanded={expanded} /> : null}
          {(isBandApp && !band ? [] : config.groups).map((group) => (
            <div key={group.label}>
              {group.soon ? (
                expanded ? (
                  <p
                    className="flex items-center px-2.5 text-xs font-medium uppercase tracking-wide text-fg-subtle"
                    aria-disabled="true"
                  >
                    {group.label}
                    <SoonBadge />
                  </p>
                ) : (
                  <>
                    <hr className="mx-2 mb-2 border-line" aria-hidden />
                    <span
                      className="flex h-9 items-center justify-center text-fg-subtle opacity-50"
                      title={`${group.label} (em breve)`}
                      aria-disabled="true"
                    >
                      <group.soon.icon className="size-5" aria-hidden />
                      <span className="sr-only">{group.label} (em breve)</span>
                    </span>
                  </>
                )
              ) : expanded ? (
                <p className="mb-1 px-2.5 text-xs font-medium uppercase tracking-wide text-fg-subtle">{group.label}</p>
              ) : (
                <hr className="mx-2 mb-2 border-line" aria-hidden />
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items
                  .filter((item) => !item.adminOnly || !isBandApp || band?.canEdit)
                  .map((item) => {
                    const active = navActive(pathname, item);
                    const ItemIcon = item.icon;
                    const hasChildren = !!item.children?.length;
                    const badge = isBandApp ? band?.badges?.[item.href] : undefined;
                    if (item.soon) {
                      return (
                        <li key={item.href}>
                          <span
                            aria-disabled="true"
                            title={`${item.label} (em breve)`}
                            className={cx(
                              "flex cursor-default items-center gap-3 rounded-md px-2.5 text-sm text-fg-subtle",
                              expanded ? "py-1.5" : "h-9 justify-center px-0 opacity-50",
                            )}
                          >
                            <ItemIcon className="size-5 shrink-0" aria-hidden />
                            {expanded ? (
                              // Nome inteiro + "Em breve" em segunda linha (nomes longos não são cortados).
                              <span className="flex min-w-0 flex-col leading-tight">
                                <span className="truncate">{item.label}</span>
                                <span className="text-[0.65rem] font-medium uppercase tracking-wide">Em breve</span>
                              </span>
                            ) : (
                              <span className="sr-only">{item.label} (em breve)</span>
                            )}
                          </span>
                        </li>
                      );
                    }
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          title={expanded ? undefined : item.label}
                          // Com submenu, quem recebe aria-current é o filho (a página); o pai só destaca a seção.
                          aria-current={active && (!hasChildren || !expanded) ? "page" : undefined}
                          className={cx(
                            "flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors",
                            active && (!hasChildren || !expanded)
                              ? "bg-surface-sunken font-medium text-fg"
                              : active
                                ? "font-medium text-fg hover:bg-surface-sunken"
                                : "text-fg-muted hover:bg-surface-sunken hover:text-fg",
                            !expanded && "justify-center px-0",
                          )}
                        >
                          <span className="relative shrink-0">
                            <ItemIcon className={cx("size-5", active ? "text-fg" : "text-fg-subtle")} aria-hidden />
                            {!expanded && badge ? (
                              <span
                                className="absolute -right-1 -top-1 size-2 rounded-full bg-warning-fg"
                                aria-hidden
                              />
                            ) : null}
                          </span>
                          <span className={expanded ? "truncate" : "sr-only"}>{item.label}</span>
                          {badge ? (
                            <span
                              className={cx(
                                "ml-auto rounded-full bg-warning-bg px-1.5 text-xs font-semibold leading-5 text-warning-fg",
                                !expanded && "sr-only",
                              )}
                            >
                              {badge}
                              <span className="sr-only"> para responder</span>
                            </span>
                          ) : null}
                        </Link>
                        {hasChildren && expanded ? (
                          <ul className="mb-1 ml-[1.375rem] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-3">
                            {item.children!.map((child) => {
                              const childActive =
                                pathname === child.href || (!child.exact && pathname.startsWith(`${child.href}/`));
                              return (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    aria-current={childActive ? "page" : undefined}
                                    className={cx(
                                      "flex h-8 items-center rounded-md px-2.5 text-sm transition-colors",
                                      childActive
                                        ? "bg-surface-sunken font-medium text-fg"
                                        : "text-fg-muted hover:bg-surface-sunken hover:text-fg",
                                    )}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={cx("border-t border-line p-3", !expanded && "flex flex-col items-center")}>
          {isBandApp && mobileOpen ? (
            <div className="mb-2 md:hidden">
              <InstallAppButton variant="menu" />
            </div>
          ) : null}
          {expanded && userName ? (
            <Link
              href={config.profile}
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
        <header className="sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b border-line bg-canvas px-4 pt-[env(safe-area-inset-top)] md:hidden">
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
          <Brand href={config.home} />
          {config.adminBadge ? <AdminBadge /> : null}
        </header>
        <main
          id="conteudo"
          className={cx(
            "min-h-0 flex-1",
            // Espaço para a barra de abas fixa (+ área da barra de gestos do iPhone).
            showTabs && "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
          )}
        >
          {children}
        </main>
      </div>

      {showTabs ? (
        <nav
          aria-label="Atalhos"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-canvas pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          <ul className="mx-auto grid h-16 max-w-lg grid-cols-5">
            {MOBILE_TABS.map((tab) => {
              const active = tabActive(pathname, tab.match);
              const TabIcon = tab.icon;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex h-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium",
                      active ? "text-fg" : "text-fg-subtle",
                    )}
                  >
                    <TabIcon className="size-5" aria-hidden strokeWidth={active ? 2.25 : 1.75} />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-expanded={mobileOpen}
                aria-controls="dashboard-nav"
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-fg-subtle"
              >
                <MenuIcon className="size-5" aria-hidden strokeWidth={1.75} />
                Menu
              </button>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
