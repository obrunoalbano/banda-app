"use client";

import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { PhoneField, TextAreaField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LeadFormData = {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  source: string | null;
  eventDate: string | null;
  city: string | null;
  eventType: string | null;
  eventDescription: string | null;
};

export function LeadForm({ lead }: { lead: LeadFormData }) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [form, setForm] = useState({
    name: lead.name,
    email: lead.email,
    whatsapp: lead.whatsapp ?? "",
    source: lead.source ?? "",
    eventDate: lead.eventDate ?? "",
    city: lead.city ?? "",
    eventType: lead.eventType ?? "",
    eventDescription: lead.eventDescription ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Strings vazias viram null no servidor (schema).
    const data = await submit<{ id: string }>(`/api/leads/${lead.id}`, "PATCH", form);
    if (!data) return;
    router.push(`/contatos/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nome"
          className="sm:col-span-2"
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <TextField
          label="Email"
          className="sm:col-span-2"
          type="email"
          required
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <PhoneField
          label="WhatsApp"
          value={form.whatsapp}
          onValueChange={(whatsapp) => set({ whatsapp })}
        />
        <TextField label="Origem" value={form.source} onChange={(e) => set({ source: e.target.value })} />
        <TextField
          label="Data do evento"
          value={form.eventDate}
          onChange={(e) => set({ eventDate: e.target.value })}
          placeholder="Ex.: 2026-12-15"
        />
        <TextField label="Cidade" value={form.city} onChange={(e) => set({ city: e.target.value })} />
        <TextField
          label="Tipo de evento"
          className="sm:col-span-2"
          value={form.eventType}
          onChange={(e) => set({ eventType: e.target.value })}
        />
        <TextAreaField
          label="Descrição do evento"
          className="sm:col-span-2"
          rows={4}
          value={form.eventDescription}
          onChange={(e) => set({ eventDescription: e.target.value })}
        />
      </div>
      <FormActions loading={loading} submitLabel="Salvar alterações" cancelHref={`/contatos/${lead.id}`} />
    </form>
  );
}
