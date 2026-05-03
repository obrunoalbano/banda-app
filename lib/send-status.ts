import type { VenueSendStatus } from "@/app/generated/prisma/enums";

export const SEND_STATUS_LABELS: Record<VenueSendStatus, string> = {
  NAO_ENVIADO: "Não enviado",
  ENVIADO: "Enviado",
  FINALIZADO: "Finalizado",
};

export const SEND_STATUS_OPTIONS: { value: VenueSendStatus; label: string }[] = [
  { value: "NAO_ENVIADO", label: SEND_STATUS_LABELS.NAO_ENVIADO },
  { value: "ENVIADO", label: SEND_STATUS_LABELS.ENVIADO },
  { value: "FINALIZADO", label: SEND_STATUS_LABELS.FINALIZADO },
];
