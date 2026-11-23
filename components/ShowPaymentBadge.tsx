import type { ShowPaymentStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/styles";
import { SHOW_PAYMENT_LABELS } from "@/lib/show-payment-status";

const tones: Record<ShowPaymentStatus, Tone> = {
  PAGO: "success",
  AGUARDANDO_PAGAMENTO: "warning",
};

/** `overdue` (cachê vencido e não pago — `isShowOverdue`) troca "Aguardando" por "Atrasado". */
export function ShowPaymentBadge({ status, overdue }: { status: ShowPaymentStatus; overdue?: boolean }) {
  if (overdue && status === "AGUARDANDO_PAGAMENTO") return <Badge tone="danger">Atrasado</Badge>;
  return <Badge tone={tones[status]}>{SHOW_PAYMENT_LABELS[status]}</Badge>;
}
