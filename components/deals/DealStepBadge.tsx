import type { DealStep } from "@/app/generated/prisma/enums";
import { Badge } from "@/components/ui/Badge";
import { DEAL_STEP_LABELS, DEAL_STEP_TONES } from "@/lib/deals";

export function DealStepBadge({ step, prefix }: { step: DealStep; prefix?: string }) {
  return (
    <Badge tone={DEAL_STEP_TONES[step]}>
      {prefix ? `${prefix}: ` : null}
      {DEAL_STEP_LABELS[step]}
    </Badge>
  );
}
