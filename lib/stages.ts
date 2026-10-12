import type { StageStatus, StageType } from "@/app/generated/prisma/enums";
import type { Tone } from "@/components/ui/styles";

export const STAGE_TYPE_LABELS: Record<StageType, string> = {
  BAR: "Bar",
  PUB: "Pub",
  CASA_DE_SHOW: "Casa de show",
  CENTRO_CULTURAL: "Centro cultural",
  RESTAURANTE: "Restaurante",
  ESPACO_DE_EVENTOS: "Espaço de eventos",
  TEATRO: "Teatro",
  OUTRO: "Outro",
};

export const STAGE_TYPE_OPTIONS = (Object.keys(STAGE_TYPE_LABELS) as StageType[]).map((value) => ({
  value,
  label: STAGE_TYPE_LABELS[value],
}));

/** Rascunho → Publicado (visível às bandas no Explorar Palcos) → Arquivado (fechou/parou de contratar). */
export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

export const STAGE_STATUS_TONES: Record<StageStatus, Tone> = {
  DRAFT: "warning",
  PUBLISHED: "success",
  ARCHIVED: "neutral",
};

export const STAGE_STATUS_OPTIONS = (Object.keys(STAGE_STATUS_LABELS) as StageStatus[]).map((value) => ({
  value,
  label: STAGE_STATUS_LABELS[value],
}));

/** Verificação "vencida": reverificar palcos verificados há mais de 6 meses. */
export const STAGE_REVERIFY_AFTER_DAYS = 180;

export function needsReverification(verifiedAt: Date | null, now: Date = new Date()): boolean {
  if (!verifiedAt) return true;
  return now.getTime() - verifiedAt.getTime() > STAGE_REVERIFY_AFTER_DAYS * 24 * 60 * 60_000;
}

/** Data de corte: verificados antes dela precisam de reverificação. */
export function reverifyCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - STAGE_REVERIFY_AFTER_DAYS * 24 * 60 * 60_000);
}
