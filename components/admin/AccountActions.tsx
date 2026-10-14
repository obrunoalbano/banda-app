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
 * Ações sobre a conta de uma banda ou de um administrador: desativar/reativar e
 * (banda) redefinir senha com nova senha provisória.
 */
export function AccountActions({
  kind,
  id,
  name,
  email,
  disabled,
  isSelf,
}: {
  kind: "band" | "admin";
  id: string;
  name: string;
  email: string;
  disabled: boolean;
  /** Administrador vendo a própria conta: não pode se desativar. */
  isSelf?: boolean;
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const base = kind === "band" ? `/api/admin/bands/${id}` : `/api/admin/admins/${id}`;
  const label = kind === "band" ? `a banda "${name}"` : `o administrador "${name}"`;

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
      {tempPassword ? <TempPasswordReveal email={email} password={tempPassword} /> : null}
      <div className="flex flex-wrap gap-3">
        {kind === "band" ? (
          <ConfirmButton
            label="Redefinir senha"
            variant="secondary"
            icon={KeyIcon}
            title="Redefinir a senha?"
            description={<>Uma nova senha provisória será gerada para {label}. A senha atual deixa de funcionar e a banda terá que criar outra no próximo acesso.</>}
            confirmLabel="Redefinir"
            onConfirm={resetPassword}
          />
        ) : null}
        {disabled ? (
          <Button variant="secondary" loading={loading} onClick={() => void setDisabled(false)}>
            Reativar conta
          </Button>
        ) : (
          <ConfirmButton
            label="Desativar conta"
            variant="danger"
            icon={DisableIcon}
            title="Desativar a conta?"
            description={<>Desativar {label}? O acesso é cortado na hora (inclusive sessões abertas). Os dados são mantidos e a conta pode ser reativada.</>}
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
