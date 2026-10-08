"use client";

import type { Venue } from "@/app/generated/prisma/client";
import { CitySelectFields } from "@/components/CitySelectFields";
import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { CurrencyField, PhoneField, SelectField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { SEND_STATUS_OPTIONS } from "@/lib/send-status";
import { useRouter } from "next/navigation";
import { useState } from "react";

type VenueFormProps = {
  mode: "create" | "edit";
  venue?: Venue;
};

export function VenueForm({ mode, venue }: VenueFormProps) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [form, setForm] = useState({
    name: venue?.name ?? "",
    responsible: venue?.responsible ?? "",
    phone: venue?.phone ?? "",
    email: venue?.email ?? "",
    city: venue?.city ?? "",
    state: venue?.state?.toUpperCase() ?? "",
    instagram: venue?.instagram ?? "",
    valorCacheCents: venue?.valorCacheCents ?? null,
    sendStatus: venue?.sendStatus ?? ("NAO_ENVIADO" as Venue["sendStatus"]),
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit<{ id: string }>(
      mode === "create" ? "/api/venues" : `/api/venues/${venue!.id}`,
      mode === "create" ? "POST" : "PATCH",
      form,
    );
    if (!data) return;
    router.push(`/casas/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nome da casa"
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
        <PhoneField
          label="Telefone"
          required
          value={form.phone}
          onValueChange={(phone) => set({ phone })}
        />
        <TextField
          label="Email"
          className="sm:col-span-2"
          type="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <CitySelectFields state={form.state} city={form.city} onChange={set} />
        <TextField
          label="Instagram"
          className="sm:col-span-2"
          value={form.instagram}
          onChange={(e) => set({ instagram: e.target.value })}
          placeholder="@casa ou URL"
        />
        <CurrencyField
          label="Cachê de referência"
          className="sm:col-span-2"
          value={form.valorCacheCents}
          onValueChange={(valorCacheCents) => set({ valorCacheCents })}
          hint="Sugerido ao cadastrar um show nesta casa. Shows já cadastrados não mudam."
        />
        <SelectField
          label="Status de envio"
          className="sm:col-span-2"
          value={form.sendStatus}
          onChange={(e) => set({ sendStatus: e.target.value as Venue["sendStatus"] })}
        >
          {SEND_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>
      <FormActions
        loading={loading}
        submitLabel={mode === "create" ? "Cadastrar casa" : "Salvar alterações"}
        cancelHref={mode === "create" ? "/casas" : `/casas/${venue!.id}`}
      />
    </form>
  );
}
