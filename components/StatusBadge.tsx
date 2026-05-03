import type { VenueSendStatus } from "@/app/generated/prisma/enums";
import { SEND_STATUS_LABELS } from "@/lib/send-status";

const styles: Record<VenueSendStatus, string> = {
  NAO_ENVIADO:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  ENVIADO: "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200",
  FINALIZADO:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200",
};

export function StatusBadge({ status }: { status: VenueSendStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {SEND_STATUS_LABELS[status]}
    </span>
  );
}
