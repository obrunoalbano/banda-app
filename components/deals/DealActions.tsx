"use client";

import type { DealStep } from "@/app/generated/prisma/enums";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { AddIcon, DeleteIcon, VenueIcon } from "@/components/ui/icons";
import { inputSmClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { canAddToVenues, DEAL_STEP_OPTIONS } from "@/lib/deals";
import { useId } from "react";

/**
 * Ações do card no quadro: mover de etapa, virar casa (só ganhou), tirar do fluxo.
 * O quadro (DealBoard) atualiza o próprio estado pelos callbacks — não depende de router.refresh().
 */
export function DealActions({
  deal,
  onMoved,
  onRemoved,
}: {
  deal: { id: string; name: string; step: DealStep; venueId: string | null };
  onMoved: (step: DealStep) => void;
  onRemoved: () => void;
}) {
  const selectId = useId();
  const { submit, loading, error } = useJsonSubmit();

  async function move(next: DealStep) {
    const data = await submit(`/api/deals/${deal.id}`, "PATCH", { step: next }, "Não foi possível mover.");
    if (data) onMoved(next);
  }

  async function remove() {
    const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return "Não foi possível tirar do fluxo.";
    onRemoved();
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-xs font-medium text-fg-muted">
          Etapa
        </label>
        <select
          id={selectId}
          value={deal.step}
          disabled={loading}
          onChange={(e) => void move(e.target.value as DealStep)}
          className={inputSmClass}
        >
          {DEAL_STEP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {canAddToVenues(deal) ? (
        <ButtonLink href={`/casas/nova?negociacao=${deal.id}`} size="sm" icon={AddIcon} className="w-full">
          Adicionar às minhas casas
        </ButtonLink>
      ) : null}
      {deal.venueId ? (
        <ButtonLink href={`/casas/${deal.venueId}`} variant="secondary" size="sm" icon={VenueIcon} className="w-full">
          Ver casa
        </ButtonLink>
      ) : null}
      <ConfirmButton
        label="Tirar do fluxo"
        variant="ghost"
        size="sm"
        icon={DeleteIcon}
        title={`Tirar "${deal.name}" do fluxo?`}
        description="A negociação sai do quadro. O contato, o palco e a casa (se já criada) não são apagados."
        confirmLabel="Tirar do fluxo"
        tone="danger"
        onConfirm={remove}
      />
    </div>
  );
}
