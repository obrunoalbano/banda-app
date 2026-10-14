"use client";

import type { DealStep } from "@/app/generated/prisma/enums";
import { DealCard, DealCardPreview, type BoardDeal } from "@/components/deals/DealCard";
import { DealDetails } from "@/components/deals/DealDetails";
import { DealStepBadge } from "@/components/deals/DealStepBadge";
import { Alert } from "@/components/ui/Alert";
import { Sheet } from "@/components/ui/Sheet";
import { cx } from "@/components/ui/styles";
import { DEAL_STEP_LABELS, DEAL_STEPS } from "@/lib/deals";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";

/** Mensagens do leitor de tela durante o arraste (padrão da lib é em inglês). */
const announcements: Announcements = {
  onDragStart: () => "Card selecionado para mover.",
  onDragOver: ({ over }) => (over ? `Sobre a coluna ${DEAL_STEP_LABELS[over.id as DealStep]}.` : "Fora das colunas."),
  onDragEnd: ({ over }) => (over ? `Movido para ${DEAL_STEP_LABELS[over.id as DealStep]}.` : "Movimento cancelado."),
  onDragCancel: () => "Movimento cancelado.",
};

/**
 * Quadro do Fluxo de contatos: arrastar e soltar entre colunas (mouse e toque) e painel de
 * detalhes ao clicar. Estado local: mover/tirar/anotar atualiza na hora, sem router.refresh()
 * (um prefetch disparado antes da mudança pode chegar depois e repor dado antigo).
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
  const [openId, setOpenId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    // Mouse (não Pointer: no celular o PointerSensor pegaria o toque e seria cancelado pela rolagem).
    // Clique simples não inicia arraste (abre os detalhes).
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Toque: segurar para arrastar; deslizar rola a página.
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
  );

  function applyMove(id: string, from: DealStep, to: DealStep, sinceLabel: string) {
    setDeals((list) => {
      const deal = list.find((d) => d.id === id);
      if (!deal) return list;
      // Vai para o topo da nova coluna (ordem = mudança de etapa mais recente).
      return [{ ...deal, step: to, sinceLabel }, ...list.filter((d) => d.id !== id)];
    });
    setCounts((c) => ({ ...c, [from]: c[from] - 1, [to]: c[to] + 1 }));
  }

  /** Otimista: move na tela, salva e desfaz se a API falhar. */
  async function move(id: string, to: DealStep) {
    const deal = deals.find((d) => d.id === id);
    if (!deal || deal.step === to) return;
    const { step: from, sinceLabel } = deal;
    setError(null);
    setMovingId(id);
    applyMove(id, from, to, "agora há pouco");
    const ok = await fetch(`/api/deals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: to }),
    })
      .then((r) => r.ok)
      .catch(() => false);
    setMovingId(null);
    if (!ok) {
      applyMove(id, to, from, sinceLabel);
      setError(`Não foi possível mover “${deal.name}”. Tente novamente.`);
    }
  }

  function onDragStart(e: DragStartEvent) {
    setDraggingId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    if (e.over) void move(String(e.active.id), e.over.id as DealStep);
  }

  function removed(id: string) {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;
    setOpenId(null);
    setDeals((list) => list.filter((d) => d.id !== id));
    setCounts((c) => ({ ...c, [deal.step]: c[deal.step] - 1 }));
  }

  const dragging = draggingId ? deals.find((d) => d.id === draggingId) : null;
  const open = openId ? deals.find((d) => d.id === openId) : null;

  return (
    <>
      {error ? (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDraggingId(null)}
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: "Use o botão do card para abrir os detalhes e mudar a etapa." },
        }}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {DEAL_STEPS.map((step) => (
            <Column key={step} step={step} count={counts[step]} dragging={!!dragging}>
              {deals
                .filter((d) => d.step === step)
                .map((deal) => (
                  <li key={deal.id}>
                    <DealCard deal={deal} onOpen={() => setOpenId(deal.id)} />
                  </li>
                ))}
            </Column>
          ))}
        </div>
        <DragOverlay dropAnimation={null}>{dragging ? <DealCardPreview deal={dragging} /> : null}</DragOverlay>
      </DndContext>

      <Sheet
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.name ?? ""}
        description={open ? <DealStepBadge step={open.step} /> : null}
      >
        {open ? (
          <DealDetails
            key={open.id}
            deal={open}
            moving={movingId === open.id}
            onMove={(to) => void move(open.id, to)}
            onNotesSaved={(notes) =>
              setDeals((list) => list.map((d) => (d.id === open.id ? { ...d, notes } : d)))
            }
            onRemoved={() => removed(open.id)}
          />
        ) : null}
      </Sheet>
    </>
  );
}

function Column({
  step,
  count,
  dragging,
  children,
}: {
  step: DealStep;
  count: number;
  dragging: boolean;
  children: React.ReactNode[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: step });
  const headingId = `etapa-${step}`;
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cx(
        "flex min-h-40 flex-col gap-3 rounded-lg border bg-surface-muted p-3 transition-colors",
        isOver ? "border-info-line bg-info-bg" : dragging ? "border-dashed border-line-strong" : "border-line",
      )}
    >
      <h2 id={headingId} className="flex items-center justify-between gap-2 text-sm font-semibold text-fg">
        <DealStepBadge step={step} />
        <span className="tabular text-fg-muted">{count}</span>
      </h2>
      {children.length === 0 ? (
        <p className="py-4 text-center text-xs text-fg-subtle">{dragging ? "Solte aqui" : "Nenhuma negociação"}</p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
      {count > children.length ? (
        <p className="text-xs text-fg-subtle">
          Mostrando {children.length} de {count}.
        </p>
      ) : null}
    </section>
  );
}
