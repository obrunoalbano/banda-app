"use client";

import { DropdownMenu, DropdownMenuHeader, DropdownMenuLink, DropdownMenuSeparator } from "@/components/ui/DropdownMenu";
import { AccountIcon, KeyIcon, SwitchBandIcon, type Icon } from "@/components/ui/icons";
import { initials } from "@/lib/format";

export type UserMenuLink = { href: string; label: string; icon: Icon };

/** Atalhos da conta por área (app da banda × painel superadmin). */
export const USER_MENU_LINKS: Record<"band" | "admin", UserMenuLink[]> = {
  band: [
    { href: "/conta", label: "Minha conta", icon: AccountIcon },
    { href: "/conta/senha", label: "Alterar senha", icon: KeyIcon },
    { href: "/bandas", label: "Minhas bandas", icon: SwitchBandIcon },
  ],
  admin: [{ href: "/admin/senha", label: "Alterar senha", icon: KeyIcon }],
};

/**
 * Avatar do usuário no header: abre o menu com as configurações da conta e "Sair".
 * `logout` vem do servidor (<LogoutButton variant="menu" />, server action).
 */
export function UserMenu({
  name,
  email,
  links,
  logout,
}: {
  name: string | null | undefined;
  email: string | null | undefined;
  links: UserMenuLink[];
  logout: React.ReactNode;
}) {
  const display = name?.trim() || email || "Sua conta";
  return (
    <DropdownMenu
      label={`Menu da conta: ${display}`}
      triggerClassName="flex size-9 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      trigger={
        <span
          aria-hidden
          className="flex size-9 select-none items-center justify-center rounded-full border border-line bg-surface-sunken text-sm font-semibold text-fg hover:border-line-strong"
        >
          {initials(name, email)}
        </span>
      }
    >
      <DropdownMenuHeader>
        <p className="truncate text-sm font-medium text-fg">{display}</p>
        {email && email !== display ? <p className="truncate text-xs text-fg-subtle">{email}</p> : null}
      </DropdownMenuHeader>
      <DropdownMenuSeparator />
      {links.map((link) => (
        <DropdownMenuLink key={link.href} href={link.href} icon={link.icon}>
          {link.label}
        </DropdownMenuLink>
      ))}
      <DropdownMenuSeparator />
      {logout}
    </DropdownMenu>
  );
}
