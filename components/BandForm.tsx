"use client";

import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { PhoneField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";
import { useState } from "react";

type BandFormProps = {
  initial: { name: string; responsible: string; phone: string; email: string };
};

export function BandForm({ initial }: BandFormProps) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState(initial);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    const data = await submit("/api/band", "PATCH", form, "Não foi possível salvar.");
    if (!data) return;
    setOk(true);
    // A API já atualizou o JWT; refresh re-renderiza o menu com o novo nome.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-4">
      {ok && <Alert tone="success">Dados atualizados.</Alert>}
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nome da banda"
          className="sm:col-span-2"
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <TextField
          label="Responsável"
          required
          value={form.responsible}
          onChange={(e) => set({ responsible: e.target.value })}
        />
        <PhoneField label="Telefone" required value={form.phone} onValueChange={(phone) => set({ phone })} />
        <TextField
          label="Email"
          className="sm:col-span-2"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />
      </div>
      <FormActions loading={loading} submitLabel="Salvar alterações" />
    </form>
  );
}
