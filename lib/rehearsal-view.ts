import { formatDateOnly } from "@/lib/format";
import { weekdayName } from "@/lib/rehearsals";

/** "terça-feira, 01/12/2026 às 19:30" */
export function formatOccurrence(date: Date, time: string): string {
  return `${weekdayName(date)}, ${formatDateOnly(date)} às ${time}`;
}
