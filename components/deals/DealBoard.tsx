"use client";

import type { DealStep } from "@/app/generated/prisma/enums";
import { DealCard, type BoardDeal } from "@/components/deals/DealCard";
import { DealStepBadge } from "@/components/deals/DealStepBadge";
import { DEAL_STEPS } from "@/lib/deals";
import { useState } from "react";

/**
 * Quadro do Fluxo de contatos (colunas por etapa). Estado local: mover/tirar atualiza na hora,
 * sem depender de router.refresh() (um prefetch antigo pode chegar depois e mostrar dado velho).
 */
export function DealBoard({
  initialDeals,
  initialCounts,
}: {
  /** Mais recentes por etapa (já limitadas no servidor). */
  initialDeals: BoardDeal[];
  /** Total por etapa (pode ser maior que o exibido). */
  initialCounts: Record<DealStep, number>;
}) {
  const [deals, setDeals] = useState(initialDeals);
  const [counts, setCounts] = useState(initialCounts);

  function moved(id: string, from: DealStep, to: DealStep) {
    if (from === to) return;
    setDeals((list) => {
      const deal = list.find((d) => d.id === id);
      if (!deal) return list;
      // Vai para o topo da nova coluna (ordem = mudança de etapa mais recente).
      return [{ ...deal, step: to, sinceLabel: "agora há pouco" }, ...list.filter((d) => d.id !== id)];
    });
    setCounts((c) => ({ ...c, [from]: c[from] - 1, [to]: c[to] + 1 }));
  }

  function removed(id: string, from: DealStep) {
    setDeals((list) => list.filter((d) => d.id !== id));
    setCounts((c) => ({ ...c, [from]: c[from] - 1 }));
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {DEAL_STEPS.map((step) => {
        const column = deals.filter((d) => d.step === step);
        const headingId = `etapa-${step}`;
        return (
          <section
            key={step}
            aria-labelledby={headingId}
            className="flex flex-col gap-3 rounded-lg border border-line bg-surface-muted p-3"
          >
            <h2 id={headingId} className="flex items-center justify-between gap-2 text-sm font-semibold text-fg">
              <DealStepBadge step={step} />
              <span className="tabular text-fg-muted">{counts[step]}</span>
            </h2>
            {column.length === 0 ? (
              <p className="py-4 text-center text-xs text-fg-subtle">Nenhuma negociação</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {column.map((deal) => (
                  <li key={deal.id}>
                    <DealCard
                      deal={deal}
                      onMoved={(to) => moved(deal.id, deal.step, to)}
                      onRemoved={() => removed(deal.id, deal.step)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {counts[step] > column.length ? (
              <p className="text-xs text-fg-subtle">
                Mostrando {column.length} de {counts[step]}.
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
