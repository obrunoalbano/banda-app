"use client";

import type { DealSource, DealStep, StageType } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/components/ui/styles";
import { DEAL_SOURCE_LABELS } from "@/lib/deals";
import { useDraggable } from "@dnd-kit/core";

/** Dados do quadro (datas já formatadas no servidor — evita divergência de hidratação). */
export type BoardDeal = {
  id: string;
  step: DealStep;
  source: DealSource;
  name: string;
  city: string | null;
  state: string | null;
  venueId: string | null;
  notes: string | null;
  /** "há 3 dias" */
  sinceLabel: string;
  createdLabel: string;
  lead: {
    id: string;
    email: string;
    whatsapp: string | null;
    city: string | null;
    eventDate: string | null;
    eventType: string | null;
    eventDescription: string | null;
    receivedLabel: string;
  } | null;
  stage: {
    type: StageType;
    neighborhood: string | null;
    city: string;
    state: string;
    whatsapp: string | null;
    publicPhone: string | null;
    publicEmail: string | null;
    instagram: string | null;
    website: string | null;
    imageThumbUrl: string | null;
    verified: boolean;
    lastActivityLabel: string | null;
    notes: string | null;
    genres: string[];
    capacity: number | null;
  } | null;
};

function CardBody({ deal }: { deal: BoardDeal }) {
  const place = [deal.city, deal.state].filter(Boolean).join("/");
  return (
    <>
      <div>
        <Badge tone={deal.source === "CONTATO" ? "info" : "neutral"}>{DEAL_SOURCE_LABELS[deal.source]}</Badge>
      </div>
      <h3 className="text-sm font-semibold text-fg">{deal.name}</h3>
      {place ? <p className="text-xs text-fg-muted">{place}</p> : null}
      <p className="text-xs text-fg-subtle">Nesta etapa {deal.sinceLabel}</p>
      {deal.notes ? <p className="line-clamp-2 text-xs text-fg-muted">“{deal.notes}”</p> : null}
    </>
  );
}

const cardClass =
  "relative flex flex-col gap-1 rounded-lg border border-line bg-surface p-3 text-left shadow-sm";

/**
 * Card arrastável (mouse/toque) que abre os detalhes ao clicar. Teclado: o botão do card abre
 * o painel, onde a etapa muda por select (não há arrastar por teclado).
 */
export function DealCard({ deal, onOpen }: { deal: BoardDeal; onOpen: () => void }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: deal.id, data: { step: deal.step } });

  return (
    <article
      ref={setNodeRef}
      id={`negociacao-${deal.id}`}
      {...listeners}
      className={cx(
        cardClass,
        "cursor-grab touch-manipulation scroll-mt-24 hover:border-line-strong target:ring-2 target:ring-focus",
        isDragging && "opacity-40",
      )}
    >
      <CardBody deal={deal} />
      {/* Botão "esticado": o card inteiro é clicável; o foco de teclado cai aqui. */}
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <span className="sr-only">Abrir detalhes de {deal.name}</span>
      </button>
    </article>
  );
}

/** Cópia exibida sob o cursor durante o arraste (DragOverlay). */
export function DealCardPreview({ deal }: { deal: BoardDeal }) {
  return (
    <div className={cx(cardClass, "cursor-grabbing rotate-1 shadow-lg ring-2 ring-focus")}>
      <CardBody deal={deal} />
    </div>
  );
}
