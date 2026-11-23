import { Badge } from "@/components/ui/Badge";
import type { Tone } from "@/components/ui/styles";
import type { EntryStatus } from "@/lib/finance";

const labels: Record<EntryStatus, string> = { PAGO: "Pago", PENDENTE: "Pendente", ATRASADO: "Atrasado" };
const tones: Record<EntryStatus, Tone> = { PAGO: "success", PENDENTE: "warning", ATRASADO: "danger" };

export function FinanceEntryStatusBadge({ status }: { status: EntryStatus }) {
  return <Badge tone={tones[status]}>{labels[status]}</Badge>;
}
