"use client";

import { useRouter } from "next/navigation";
import { ConfirmButton } from "./ConfirmButton";
import { DeleteIcon } from "./icons";

type ConfirmDeleteButtonProps = {
  /** Endpoint que recebe o DELETE (ex.: `/api/shows/123`). */
  endpoint: string;
  /** Para onde ir após remover. */
  redirectTo: string;
  /** Ex.: `o show "Bar X - 15/12/2026"`. */
  itemLabel: string;
  /** Quando definido, o botão fica desabilitado e o motivo aparece como dica. */
  disabledReason?: string;
};

/** "Remover" com confirmação; chama DELETE na API e navega para `redirectTo`. */
export function ConfirmDeleteButton({
  endpoint,
  redirectTo,
  itemLabel,
  disabledReason,
}: ConfirmDeleteButtonProps) {
  const router = useRouter();

  async function remove(): Promise<string | null> {
    const res = await fetch(endpoint, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      return typeof data.error === "string" ? data.error : "Não foi possível remover.";
    }
    router.push(redirectTo);
    router.refresh();
    return null;
  }

  return (
    <ConfirmButton
      label="Remover"
      variant="danger"
      icon={DeleteIcon}
      title="Remover?"
      description={<>Remover {itemLabel}? Esta ação não pode ser desfeita.</>}
      confirmLabel="Remover"
      tone="danger"
      onConfirm={remove}
      disabledReason={disabledReason}
    />
  );
}
