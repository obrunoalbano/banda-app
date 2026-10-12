"use client";

import type { DealSource, DealStep } from "@/app/generated/prisma/enums";
import { DealActions } from "@/components/deals/DealActions";
import { Badge } from "@/components/ui/Badge";
import { EmailIcon, ExternalLinkIcon, WhatsappIcon } from "@/components/ui/icons";
import { subtleLinkClass } from "@/components/ui/styles";
import { DEAL_SOURCE_LABELS } from "@/lib/deals";
import { instagramHref, whatsappHref } from "@/lib/format";
import Link from "next/link";

export type BoardDeal = {
  id: string;
  step: DealStep;
  source: DealSource;
  name: string;
  city: string | null;
  state: string | null;
  venueId: string | null;
  /** "há 3 dias" — formatado no servidor (evita divergência de hidratação). */
  sinceLabel: string;
  lead: { id: string; email: string; whatsapp: string | null } | null;
  stage: { whatsapp: string | null; instagram: string | null } | null;
};

/** Card do quadro do Fluxo de contatos. `id` é âncora do "Ver no fluxo". */
export function DealCard({
  deal,
  onMoved,
  onRemoved,
}: {
  deal: BoardDeal;
  onMoved: (step: DealStep) => void;
  onRemoved: () => void;
}) {
  const wa = whatsappHref(deal.lead?.whatsapp ?? deal.stage?.whatsapp ?? null);
  const ig = instagramHref(deal.stage?.instagram ?? null);
  const place = [deal.city, deal.state].filter(Boolean).join("/");

  return (
    <article
      id={`negociacao-${deal.id}`}
      className="flex scroll-mt-24 flex-col gap-3 rounded-lg border border-line bg-surface p-3 target:ring-2 target:ring-focus"
    >
      <div className="flex flex-col gap-1">
        <div>
          <Badge tone={deal.source === "CONTATO" ? "info" : "neutral"}>{DEAL_SOURCE_LABELS[deal.source]}</Badge>
        </div>
        <h3 className="text-sm font-semibold text-fg">
          {deal.lead ? (
            <Link href={`/contatos/${deal.lead.id}`} className="hover:underline">
              {deal.name}
            </Link>
          ) : (
            deal.name
          )}
        </h3>
        {place ? <p className="text-xs text-fg-muted">{place}</p> : null}
        <p className="text-xs text-fg-subtle">Nesta etapa {deal.sinceLabel}</p>
      </div>

      {wa || ig || deal.lead ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className={`${subtleLinkClass} inline-flex items-center gap-1`}>
              <WhatsappIcon className="size-3.5" aria-hidden />
              WhatsApp
            </a>
          ) : null}
          {deal.lead ? (
            <a href={`mailto:${deal.lead.email}`} className={`${subtleLinkClass} inline-flex items-center gap-1`}>
              <EmailIcon className="size-3.5" aria-hidden />
              Email
            </a>
          ) : null}
          {ig ? (
            <a href={ig} target="_blank" rel="noopener noreferrer" className={`${subtleLinkClass} inline-flex items-center gap-1`}>
              <ExternalLinkIcon className="size-3.5" aria-hidden />
              Instagram
            </a>
          ) : null}
        </div>
      ) : null}

      <DealActions
        deal={{ id: deal.id, name: deal.name, step: deal.step, venueId: deal.venueId }}
        onMoved={onMoved}
        onRemoved={onRemoved}
      />
    </article>
  );
}
