import { signOut } from "@/auth";
import { LogoutIcon } from "@/components/ui/icons";
import { buttonClass, cx, menuItemClass } from "@/components/ui/styles";

/**
 * Sair (server action). `variant="menu"`: item do menu do avatar no header (`DropdownMenu`).
 * Padrão: botão discreto (ex.: tela de convite com a conta errada).
 */
export function LogoutButton({
  redirectTo = "/login",
  variant = "button",
}: {
  redirectTo?: string;
  variant?: "button" | "menu";
}) {
  if (variant === "menu") {
    return (
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo });
        }}
      >
        <button type="submit" role="menuitem" tabIndex={-1} className={menuItemClass}>
          <LogoutIcon className="size-4 shrink-0" aria-hidden />
          Sair
        </button>
      </form>
    );
  }
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo });
      }}
    >
      <button
        type="submit"
        title="Sair"
        className={cx(
          buttonClass("ghost", "sm"),
          "w-full justify-start",
        )}
      >
        <LogoutIcon aria-hidden />
        <span>Sair</span>
      </button>
    </form>
  );
}
