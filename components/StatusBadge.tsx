import type { VenueSendStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/styles";
import { SEND_STATUS_LABELS } from "@/lib/send-status";

/** Pendente → warning, em andamento → info, concluído → success. */
const tones: Record<VenueSendStatus, Tone> = {
  NAO_ENVIADO: "warning",
  ENVIADO: "info",
  FINALIZADO: "success",
};

export function StatusBadge({ status }: { status: VenueSendStatus }) {
  return <Badge tone={tones[status]}>{SEND_STATUS_LABELS[status]}</Badge>;
}
