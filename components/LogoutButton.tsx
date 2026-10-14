import { signOut } from "@/auth";
import { LogoutIcon } from "@/components/ui/icons";
import { buttonClass, cx } from "@/components/ui/styles";

/**
 * Sair (server action). Dentro do DashboardShell, o texto some quando o menu está
 * recolhido (`group-data-[collapsed=true]`), ficando só o ícone com aria-label.
 */
export function LogoutButton({ redirectTo = "/login" }: { redirectTo?: string }) {
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
          "w-full justify-start group-data-[collapsed=true]:w-8 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-0",
        )}
      >
        <LogoutIcon aria-hidden />
        <span className="group-data-[collapsed=true]:sr-only">Sair</span>
      </button>
    </form>
  );
}
