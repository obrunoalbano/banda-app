import type { ShowPaymentStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/styles";
import { SHOW_PAYMENT_LABELS } from "@/lib/show-payment-status";

const tones: Record<ShowPaymentStatus, Tone> = {
  PAGO: "success",
  AGUARDANDO_PAGAMENTO: "warning",
};

export function ShowPaymentBadge({ status }: { status: ShowPaymentStatus }) {
  return <Badge tone={tones[status]}>{SHOW_PAYMENT_LABELS[status]}</Badge>;
}
