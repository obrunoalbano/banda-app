import type { AttendanceStatus } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/Badge";
import { ATTENDANCE_LABELS, ATTENDANCE_TONES } from "@/lib/rehearsals";

/** Presença no ensaio: Confirmado (success) · Não vai (danger) · Sem resposta (warning). */
export function AttendanceBadge({ status }: { status: AttendanceStatus | null | undefined }) {
  const key = status ?? "PENDING";
  return <Badge tone={ATTENDANCE_TONES[key]}>{ATTENDANCE_LABELS[key]}</Badge>;
}
