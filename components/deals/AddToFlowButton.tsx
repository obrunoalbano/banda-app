"use client";

import type { DealStep } from "@/app/generated/prisma/enums";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AddIcon, DealIcon } from "@/components/ui/icons";
import type { ButtonSize } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { DEAL_STEP_LABELS, DEAL_STEP_TONES } from "@/lib/deals";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Origin = { leadId: string } | { stageId: string };
type DealRef = { id: string; step: DealStep };

/**
 * "Adicionar ao fluxo" (contato ou palco). Quando já está no fluxo, mostra a etapa
 * e o link para o quadro.
 */
export function AddToFlowButton({
  origin,
  deal: initialDeal,
  size = "md",
  fullWidth = false,
}: {
  origin: Origin;
  deal: DealRef | null;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [deal, setDeal] = useState(initialDeal);

  if (deal) {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${fullWidth ? "justify-between" : ""}`}>
        <Badge tone={DEAL_STEP_TONES[deal.step]}>No fluxo: {DEAL_STEP_LABELS[deal.step]}</Badge>
        <ButtonLink href={`/fluxo#negociacao-${deal.id}`} variant="ghost" size="sm" icon={DealIcon}>
          Ver no fluxo
        </ButtonLink>
      </div>
    );
  }

  async function add() {
    const data = await submit<DealRef>("/api/deals", "POST", origin, "Não foi possível adicionar ao fluxo.");
    if (!data) return;
    setDeal({ id: data.id, step: data.step });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      <Button
        icon={AddIcon}
        size={size}
        loading={loading}
        onClick={() => void add()}
        className={fullWidth ? "w-full" : undefined}
      >
        Adicionar ao fluxo
      </Button>
    </div>
  );
}
