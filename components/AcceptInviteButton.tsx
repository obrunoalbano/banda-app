"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";

/**
 * Aceita o convite e abre a banda (usuário logado). `kind="band"`: link de convite do grupo;
 * padrão: convite individual (email convidado).
 */
export function AcceptInviteButton({
  token,
  bandName,
  kind = "member",
}: {
  token: string;
  bandName: string;
  kind?: "member" | "band";
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();

  async function accept() {
    const endpoint = `/api/invites/${kind === "band" ? "band/" : ""}${encodeURIComponent(token)}`;
    const data = await submit(endpoint, "POST", {}, "Não foi possível aceitar o convite.");
    if (!data) return;
    router.push("/casas");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <Button className="w-full" loading={loading} onClick={() => void accept()}>
        Entrar na {bandName}
      </Button>
    </div>
  );
}
