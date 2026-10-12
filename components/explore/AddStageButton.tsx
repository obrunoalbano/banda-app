"use client";

import { Alert } from "@/components/ui/Alert";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AddIcon, CheckIcon } from "@/components/ui/icons";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useState } from "react";

/** "Adicionar às minhas casas" → vira link "Nas suas casas" quando o palco já está no funil. */
export function AddStageButton({ stageId, venueId: initialVenueId }: { stageId: string; venueId: string | null }) {
  const { submit, loading, error } = useJsonSubmit();
  const [venueId, setVenueId] = useState(initialVenueId);

  if (venueId) {
    return (
      <ButtonLink href={`/casas/${venueId}`} variant="secondary" icon={CheckIcon} className="w-full">
        Nas suas casas
      </ButtonLink>
    );
  }

  async function add() {
    const data = await submit<{ venueId: string }>(`/api/explorar/${stageId}`, "POST", {}, "Não foi possível adicionar.");
    if (data) setVenueId(data.venueId);
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      <Button icon={AddIcon} loading={loading} onClick={() => void add()} className="w-full">
        Adicionar às minhas casas
      </Button>
    </div>
  );
}
