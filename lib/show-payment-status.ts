import type { ShowPaymentStatus } from "@/app/generated/prisma/enums";

export const SHOW_PAYMENT_LABELS: Record<ShowPaymentStatus, string> = {
  PAGO: "Pago",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
};

export const SHOW_PAYMENT_OPTIONS: { value: ShowPaymentStatus; label: string }[] = [
  { value: "PAGO", label: SHOW_PAYMENT_LABELS.PAGO },
  { value: "AGUARDANDO_PAGAMENTO", label: SHOW_PAYMENT_LABELS.AGUARDANDO_PAGAMENTO },
];
