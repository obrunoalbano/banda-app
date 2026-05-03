import type { ShowPaymentStatus } from "@/app/generated/prisma/enums";
import { SHOW_PAYMENT_LABELS } from "@/lib/show-payment-status";

export function ShowPaymentBadge({ status }: { status: ShowPaymentStatus }) {
  const isPaid = status === "PAGO";
  return (
    <span
      className={
        isPaid
          ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
          : "inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      }
    >
      {SHOW_PAYMENT_LABELS[status]}
    </span>
  );
}
