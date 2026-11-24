"use client";

import { InviteResultAlert, type InviteResult } from "@/components/AddMemberForm";
import { Alert } from "@/components/ui/Alert";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { DeleteIcon, LinkIcon } from "@/components/ui/icons";
import { inputSmClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import type { BandRole } from "@/app/generated/prisma/enums";
import { BAND_ROLE_SHORT } from "@/lib/band-roles";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Ações do administrador sobre um integrante: papel, novo link de convite, remover. */
export function MemberActions({
  member,
  isSelf,
  blockReason,
}: {
  member: { id: string; name: string; email: string; role: BandRole; pending: boolean };
  isSelf: boolean;
  /** Último administrador: não pode ser rebaixado nem removido. */
  blockReason: string | null;
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const base = `/api/band/members/${member.id}`;

  async function changeRole(role: BandRole) {
    if (await submit(base, "PATCH", { role }, "Não foi possível alterar o acesso.")) router.refresh();
  }

  async function remove(): Promise<string | null> {
    const res = await fetch(base, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      return typeof data.error === "string" ? data.error : "Não foi possível remover.";
    }
    router.push(isSelf ? "/bandas" : "/banda/integrantes");
    router.refresh();
    return null;
  }

  async function resend(): Promise<string | null> {
    setInvite(null);
    const data = await submit<InviteResult>(`${base}/invite`, "POST", {}, "Não foi possível gerar o link.");
    if (!data) return "Não foi possível gerar o link.";
    setInvite(data);
    router.refresh();
    return null;
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <label className="sr-only" htmlFor={`role-${member.id}`}>
          Acesso de {member.name}
        </label>
        <select
          id={`role-${member.id}`}
          className={inputSmClass}
          value={member.role}
          disabled={loading || (!!blockReason && member.role === "ADMIN")}
          title={blockReason ?? undefined}
          onChange={(e) => void changeRole(e.target.value as BandRole)}
        >
          {(Object.keys(BAND_ROLE_SHORT) as BandRole[]).map((r) => (
            <option key={r} value={r}>
              {BAND_ROLE_SHORT[r]}
            </option>
          ))}
        </select>
        {member.pending ? (
          <ConfirmButton
            label="Novo link"
            size="sm"
            variant="secondary"
            icon={LinkIcon}
            title="Gerar novo link de convite?"
            description={<>O link anterior deixa de valer. Enviaremos o novo para {member.email}.</>}
            confirmLabel="Gerar link"
            onConfirm={resend}
            result={invite ? <InviteResultAlert result={invite} email={member.email} /> : null}
          />
        ) : null}
        <ConfirmButton
          label={member.pending ? "Cancelar convite" : isSelf ? "Sair da banda" : "Remover"}
          size="sm"
          variant="ghost"
          icon={DeleteIcon}
          title={member.pending ? "Cancelar o convite?" : isSelf ? "Sair da banda?" : `Remover ${member.name}?`}
          description={
            member.pending
              ? "O link enviado deixa de funcionar."
              : isSelf
                ? "Você perde o acesso a esta banda. Para voltar, outro administrador precisa adicionar você de novo."
                : "A pessoa perde o acesso a esta banda na hora. A conta dela continua existindo."
          }
          confirmLabel={member.pending ? "Cancelar convite" : isSelf ? "Sair" : "Remover"}
          tone="danger"
          onConfirm={remove}
          disabledReason={blockReason ?? undefined}
        />
      </div>
    </div>
  );
}
