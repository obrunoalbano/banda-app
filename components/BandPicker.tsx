"use client";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import type { BandRole } from "@/app/generated/prisma/enums";
import { BAND_ROLE_SHORT, BAND_ROLE_TONES } from "@/lib/band-roles";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = { bandId: string; bandName: string; role: BandRole };

/** Lista das bandas do usuário com a ação de passar a usar uma delas. */
export function BandPicker({ bands, activeBandId }: { bands: Item[]; activeBandId: string | null }) {
  const router = useRouter();
  const { submit, error } = useJsonSubmit();
  const [pending, setPending] = useState<string | null>(null);

  async function choose(bandId: string) {
    setPending(bandId);
    const data = await submit("/api/bands/current", "POST", { bandId }, "Não foi possível trocar de banda.");
    setPending(null);
    if (!data) return;
    router.push("/casas");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{error}</Alert> : null}
      <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
        {bands.map((b) => {
          const active = b.bandId === activeBandId;
          return (
            <li key={b.bandId} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-fg">{b.bandName}</span>
                <span className="mt-1 flex flex-wrap gap-2">
                  <Badge tone={BAND_ROLE_TONES[b.role]}>{BAND_ROLE_SHORT[b.role]}</Badge>
                  {active ? <Badge tone="success">Em uso</Badge> : null}
                </span>
              </span>
              <Button
                size="sm"
                variant={active ? "secondary" : "primary"}
                loading={pending === b.bandId}
                onClick={() => void choose(b.bandId)}
              >
                {active ? "Abrir" : "Usar esta banda"}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
