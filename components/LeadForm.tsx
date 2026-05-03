"use client";

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

type LeadFormProps = {
  mode: "edit";
  lead: LeadFormData;
};

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

export function LeadForm({ lead }: LeadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        whatsapp: form.whatsapp || null,
        source: form.source || null,
        eventDate: form.eventDate || null,
        city: form.city || null,
        eventType: form.eventType || null,
        eventDescription: form.eventDescription || null,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
      return;
    }

    router.push(`/contatos/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">WhatsApp</label>
          <input
            type="tel"
            value={form.whatsapp}
            onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Origem</label>
          <input
            value={form.source}
            onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data do evento</label>
          <input
            value={form.eventDate}
            onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
            className={inputClass}
            placeholder="Ex.: 2026-12-15"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cidade</label>
          <input
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipo de evento</label>
          <input
            value={form.eventType}
            onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Descrição do evento
          </label>
          <textarea
            rows={4}
            value={form.eventDescription}
            onChange={(e) => setForm((f) => ({ ...f, eventDescription: e.target.value }))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
