"use client";

import type { DealStep } from "@/app/generated/prisma/enums";
import type { BoardDeal } from "@/components/deals/DealCard";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { DetailItem, DetailList, ExternalLink } from "@/components/ui/DetailList";
import { SelectField, TextAreaField } from "@/components/ui/fields";
import {
  AddIcon,
  DeleteIcon,
  EmailIcon,
  ExploreIcon,
  ExternalLinkIcon,
  LeadIcon,
  PhoneIcon,
  VenueIcon,
  VerifiedIcon,
  WhatsappIcon,
} from "@/components/ui/icons";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { canAddToVenues, DEAL_STEP_OPTIONS } from "@/lib/deals";
import { instagramHref, whatsappHref } from "@/lib/format";
import { STAGE_TYPE_LABELS } from "@/lib/stages";
import Image from "next/image";
import { useState } from "react";

const sectionTitle = "mb-3 text-sm font-semibold text-fg";

/** Conteúdo do painel de uma negociação: etapa, dados da origem, observações e ações. */
export function DealDetails({
  deal,
  moving,
  onMove,
  onNotesSaved,
  onRemoved,
}: {
  deal: BoardDeal;
  moving: boolean;
  onMove: (step: DealStep) => void;
  onNotesSaved: (notes: string | null) => void;
  onRemoved: () => void;
}) {
  const notes = useJsonSubmit();
  const [draft, setDraft] = useState(deal.notes ?? "");
  const [saved, setSaved] = useState(false);
  const dirty = draft.trim() !== (deal.notes ?? "");

  async function saveNotes(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    const data = await notes.submit<{ notes: string | null }>(
      `/api/deals/${deal.id}`,
      "PATCH",
      { notes: draft },
      "Não foi possível salvar a observação.",
    );
    if (!data) return;
    onNotesSaved(data.notes ?? null);
    setDraft(data.notes ?? "");
    setSaved(true);
  }

  async function remove() {
    const res = await fetch(`/api/deals/${deal.id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) return "Não foi possível tirar do fluxo.";
    onRemoved();
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <SelectField
          label="Etapa"
          value={deal.step}
          disabled={moving}
          onChange={(e) => onMove(e.target.value as DealStep)}
          hint="Você também pode arrastar o card entre as colunas."
        >
          {DEAL_STEP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        {canAddToVenues(deal) ? (
          <ButtonLink href={`/casas/nova?negociacao=${deal.id}`} icon={AddIcon}>
            Adicionar às minhas casas
          </ButtonLink>
        ) : null}
        {deal.venueId ? (
          <ButtonLink href={`/casas/${deal.venueId}`} variant="secondary" icon={VenueIcon}>
            Ver casa
          </ButtonLink>
        ) : null}
        <p className="text-xs text-fg-subtle">
          No fluxo desde {deal.createdLabel} · nesta etapa {deal.sinceLabel}
        </p>
      </div>

      {deal.stage ? <StageInfo stage={deal.stage} /> : null}
      {deal.lead ? <LeadInfo lead={deal.lead} /> : null}
      {!deal.stage && !deal.lead ? (
        <Alert tone="info">
          A origem desta negociação foi removida
          {deal.source === "CONTATO" ? " (contato apagado)" : " (palco retirado do diretório)"}. O nome e a cidade
          foram guardados no fluxo.
        </Alert>
      ) : null}

      <section aria-labelledby={`obs-${deal.id}`}>
        <h3 id={`obs-${deal.id}`} className={sectionTitle}>
          Observações
        </h3>
        <form onSubmit={saveNotes} className="flex flex-col gap-3">
          {notes.error ? <Alert>{notes.error}</Alert> : null}
          {saved && !dirty ? <Alert tone="success">Observação salva.</Alert> : null}
          <TextAreaField
            label="Anotações da banda"
            rows={5}
            maxLength={5000}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setSaved(false);
            }}
            placeholder="Ex.: falei com o gerente, pediu proposta até sexta; cachê sugerido R$ 1.500."
            hint="Só a sua banda vê."
          />
          <div>
            <Button type="submit" variant="secondary" loading={notes.loading} disabled={!dirty}>
              Salvar observação
            </Button>
          </div>
        </form>
      </section>

      <div className="mt-auto border-t border-line pt-4">
        <ConfirmButton
          label="Tirar do fluxo"
          variant="ghost"
          size="sm"
          icon={DeleteIcon}
          title={`Tirar "${deal.name}" do fluxo?`}
          description="A negociação e as observações saem do quadro. O contato, o palco e a casa (se já criada) não são apagados."
          confirmLabel="Tirar do fluxo"
          tone="danger"
          onConfirm={remove}
        />
      </div>
    </>
  );
}

function StageInfo({ stage }: { stage: NonNullable<BoardDeal["stage"]> }) {
  const wa = whatsappHref(stage.whatsapp);
  const ig = instagramHref(stage.instagram);
  return (
    <section aria-labelledby="palco-info">
      <h3 id="palco-info" className={sectionTitle}>
        Palco
      </h3>
      <div className="mb-4 flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-surface-sunken">
          {stage.imageThumbUrl ? (
            <Image src={stage.imageThumbUrl} alt="" fill unoptimized sizes="80px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center" aria-hidden>
              <ExploreIcon className="size-6 text-fg-subtle" strokeWidth={1.5} />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            <Badge>{STAGE_TYPE_LABELS[stage.type]}</Badge>
            {stage.verified ? (
              <Badge tone="success">
                <VerifiedIcon className="mr-1 size-3" aria-hidden />
                Verificado
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-fg-muted">
            {[stage.neighborhood, `${stage.city}/${stage.state}`].filter(Boolean).join(" · ")}
          </p>
          {stage.lastActivityLabel ? (
            <p className="text-xs text-fg-subtle">Atividade registrada em {stage.lastActivityLabel}</p>
          ) : null}
        </div>
      </div>
      <DetailList className="max-w-none">
        <DetailItem label="WhatsApp">
          {stage.whatsapp && wa ? (
            <ExternalLink href={wa} icon={WhatsappIcon}>
              {stage.whatsapp}
            </ExternalLink>
          ) : null}
        </DetailItem>
        <DetailItem label="Telefone">
          {stage.publicPhone ? (
            <ExternalLink href={`tel:${stage.publicPhone.replace(/\D/g, "")}`} icon={PhoneIcon}>
              {stage.publicPhone}
            </ExternalLink>
          ) : null}
        </DetailItem>
        <DetailItem label="Email" wide>
          {stage.publicEmail ? (
            <ExternalLink href={`mailto:${stage.publicEmail}`} icon={EmailIcon}>
              {stage.publicEmail}
            </ExternalLink>
          ) : null}
        </DetailItem>
        <DetailItem label="Instagram">
          {stage.instagram && ig ? (
            <ExternalLink href={ig} icon={ExternalLinkIcon}>
              {stage.instagram}
            </ExternalLink>
          ) : null}
        </DetailItem>
        <DetailItem label="Site">
          {stage.website ? (
            <ExternalLink href={stage.website} icon={ExternalLinkIcon}>
              {stage.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </ExternalLink>
          ) : null}
        </DetailItem>
        {stage.capacity ? <DetailItem label="Capacidade">{stage.capacity} pessoas</DetailItem> : null}
        {stage.genres.length ? <DetailItem label="Estilos">{stage.genres.join(", ")}</DetailItem> : null}
        {stage.notes ? (
          <DetailItem label="Sobre o palco" wide preserveLines>
            {stage.notes}
          </DetailItem>
        ) : null}
      </DetailList>
    </section>
  );
}

function LeadInfo({ lead }: { lead: NonNullable<BoardDeal["lead"]> }) {
  const wa = whatsappHref(lead.whatsapp);
  return (
    <section aria-labelledby="contato-info">
      <h3 id="contato-info" className={sectionTitle}>
        Contato
      </h3>
      <DetailList className="max-w-none">
        <DetailItem label="Email" wide>
          <ExternalLink href={`mailto:${lead.email}`} icon={EmailIcon}>
            {lead.email}
          </ExternalLink>
        </DetailItem>
        <DetailItem label="WhatsApp">
          {lead.whatsapp ? (
            wa ? (
              <ExternalLink href={wa} icon={WhatsappIcon}>
                {lead.whatsapp}
              </ExternalLink>
            ) : (
              lead.whatsapp
            )
          ) : null}
        </DetailItem>
        <DetailItem label="Cidade">{lead.city}</DetailItem>
        <DetailItem label="Data do evento">{lead.eventDate}</DetailItem>
        <DetailItem label="Tipo de evento">{lead.eventType}</DetailItem>
        <DetailItem label="Descrição do evento" wide preserveLines>
          {lead.eventDescription}
        </DetailItem>
        <DetailItem label="Recebido em">{lead.receivedLabel}</DetailItem>
      </DetailList>
      <div className="mt-3">
        <ButtonLink href={`/contatos/${lead.id}`} variant="ghost" size="sm" icon={LeadIcon}>
          Abrir contato
        </ButtonLink>
      </div>
    </section>
  );
}
