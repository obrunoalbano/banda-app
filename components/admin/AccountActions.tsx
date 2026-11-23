"use client";

import { TempPasswordReveal } from "@/components/admin/TempPasswordReveal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { DisableIcon, KeyIcon } from "@/components/ui/icons";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Ações da equipe: desativar/reativar (banda, conta de usuário ou administrador) e
 * (usuário) redefinir senha com nova senha provisória.
 */
export function AccountActions({
  kind,
  id,
  name,
  email,
  disabled,
  isSelf,
}: {
  kind: "band" | "user" | "admin";
  id: string;
  name: string;
  /** Email de login (usuário/administrador): mostrado junto da senha provisória. */
  email?: string;
  disabled: boolean;
  /** Administrador vendo a própria conta: não pode se desativar. */
  isSelf?: boolean;
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const base = { band: `/api/admin/bands/${id}`, user: `/api/admin/users/${id}`, admin: `/api/admin/admins/${id}` }[kind];
  const label = { band: `a banda "${name}"`, user: `a conta de "${name}"`, admin: `o administrador "${name}"` }[kind];
  const disableEffect =
    kind === "band"
      ? "Ninguém acessa a banda (inclusive sessões abertas); os integrantes continuam com acesso às outras bandas."
      : "O acesso é cortado na hora (inclusive sessões abertas).";

  async function setDisabled(value: boolean): Promise<string | null> {
    const data = await submit(base, "PATCH", { disabled: value }, "Não foi possível atualizar.");
    if (!data) return "Não foi possível atualizar.";
    router.refresh();
    return null;
  }

  async function resetPassword(): Promise<string | null> {
    const data = await submit<{ tempPassword: string }>(`${base}/reset-password`, "POST", {}, "Não foi possível redefinir.");
    if (!data) return "Não foi possível redefinir.";
    setTempPassword(data.tempPassword);
    router.refresh();
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      {tempPassword ? <TempPasswordReveal email={email ?? ""} password={tempPassword} /> : null}
      <div className="flex flex-wrap gap-3">
        {kind === "user" ? (
          <ConfirmButton
            label="Redefinir senha"
            variant="secondary"
            icon={KeyIcon}
            title="Redefinir a senha?"
            description={<>Uma nova senha provisória será gerada para {label}. A senha atual deixa de funcionar e a pessoa terá que criar outra no próximo acesso.</>}
            confirmLabel="Redefinir"
            onConfirm={resetPassword}
          />
        ) : null}
        {disabled ? (
          <Button variant="secondary" loading={loading} onClick={() => void setDisabled(false)}>
            {kind === "band" ? "Reativar banda" : "Reativar conta"}
          </Button>
        ) : (
          <ConfirmButton
            label={kind === "band" ? "Desativar banda" : "Desativar conta"}
            variant="danger"
            icon={DisableIcon}
            title={kind === "band" ? "Desativar a banda?" : "Desativar a conta?"}
            description={<>Desativar {label}? {disableEffect} Os dados são mantidos e é possível reativar.</>}
            confirmLabel="Desativar"
            tone="danger"
            onConfirm={() => setDisabled(true)}
            disabledReason={isSelf ? "Você não pode desativar a sua própria conta." : undefined}
          />
        )}
      </div>
    </div>
  );
}
