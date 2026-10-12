/**
 * Fluxo de contatos (CRM simples): etapas fixas, origem (contato ou Explorar Palcos)
 * e conversão da negociação ganha em casa. Puro — coberto por lib/deals.test.ts.
 */
import type { DealSource, DealStep } from "@/app/generated/prisma/enums";
import type { Tone } from "@/components/ui/styles";

/** Ordem das colunas do quadro. */
export const DEAL_STEPS: DealStep[] = ["PRIMEIRO_CONTATO", "PROPOSTA", "PERDEU", "GANHOU"];

export const DEAL_STEP_LABELS: Record<DealStep, string> = {
  PRIMEIRO_CONTATO: "Primeiro contato",
  PROPOSTA: "Proposta",
  PERDEU: "Perdeu",
  GANHOU: "Ganhou",
};

export const DEAL_STEP_OPTIONS = DEAL_STEPS.map((value) => ({ value, label: DEAL_STEP_LABELS[value] }));

/** Em andamento → info/warning; ganhou → success; perdeu → neutro (não é erro). */
export const DEAL_STEP_TONES: Record<DealStep, Tone> = {
  PRIMEIRO_CONTATO: "info",
  PROPOSTA: "warning",
  PERDEU: "neutral",
  GANHOU: "success",
};

export const DEAL_SOURCE_LABELS: Record<DealSource, string> = {
  CONTATO: "Contato",
  EXPLORADOR: "Explorar Palcos",
};

/** Itens por coluna no quadro (as mais recentes na etapa). */
export const DEAL_COLUMN_LIMIT = 50;

/** "Adicionar às minhas casas" só aparece para negociação ganha que ainda não virou casa. */
export function canAddToVenues(deal: { step: DealStep; venueId: string | null }): boolean {
  return deal.step === "GANHOU" && deal.venueId === null;
}

type LeadOrigin = { id: string; name: string; city: string | null };
type StageOrigin = { id: string; name: string; city: string; state: string };

/** Dados copiados para a negociação ao incluir um contato no fluxo. */
export function dealFromLead(lead: LeadOrigin, bandId: string) {
  return { bandId, source: "CONTATO" as const, leadId: lead.id, name: lead.name, city: lead.city, state: null };
}

/** Dados copiados para a negociação ao incluir um palco do Explorar no fluxo. */
export function dealFromStage(stage: StageOrigin, bandId: string) {
  return {
    bandId,
    source: "EXPLORADOR" as const,
    stageId: stage.id,
    name: stage.name,
    city: stage.city,
    state: stage.state,
  };
}

/** Valores iniciais do formulário de casa (todos strings; o usuário completa e confere). */
export type VenuePrefill = {
  name: string;
  responsible: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  instagram: string;
};

type StageContact = {
  name: string;
  city: string;
  state: string;
  instagram: string | null;
  whatsapp: string | null;
  publicPhone: string | null;
  publicEmail: string | null;
};

/** Palco → casa. Responsável fica vazio: o diretório não guarda pessoas (LGPD). */
export function venuePrefillFromStage(stage: StageContact): VenuePrefill {
  return {
    name: stage.name,
    responsible: "",
    phone: stage.whatsapp ?? stage.publicPhone ?? "",
    email: stage.publicEmail ?? "",
    city: stage.city,
    state: stage.state,
    instagram: stage.instagram ?? "",
  };
}

type LeadContact = { name: string; email: string; whatsapp: string | null; city: string | null };

/** Contato → casa: a pessoa vira o responsável; o nome da casa a banda preenche. */
export function venuePrefillFromLead(lead: LeadContact): VenuePrefill {
  return {
    name: "",
    responsible: lead.name,
    phone: lead.whatsapp ?? "",
    email: lead.email,
    city: lead.city ?? "",
    state: "",
    instagram: "",
  };
}

/** Casa ainda sem negociação de origem (snapshot) → prefill mínimo pelo nome/cidade copiados. */
export function venuePrefillFromSnapshot(deal: { name: string; city: string | null; state: string | null }): VenuePrefill {
  return { name: deal.name, responsible: "", phone: "", email: "", city: deal.city ?? "", state: deal.state ?? "", instagram: "" };
}
