"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { AddIcon } from "@/components/ui/icons";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Cria mais uma banda (quem cria é administrador dela) e já passa a usá-la. */
export function CreateBandForm() {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit(
      "/api/bands",
      "POST",
      { name },
      "Não foi possível criar a banda.",
    );
    if (!data) return;
    router.push("/banda/integrantes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <TextField
          label="Nome da banda"
          className="flex-1"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" icon={AddIcon} loading={loading}>
          Criar banda
        </Button>
      </div>
    </form>
  );
}
