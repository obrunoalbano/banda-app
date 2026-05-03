"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BandFormProps = {
  initial: { name: string; responsible: string; phone: string; email: string };
};

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

export function BandForm({ initial }: BandFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    setError(null);
    setLoading(true);
    const res = await fetch("/api/band", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Não foi possível salvar.");
      return;
    }
    setOk(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-4">
      {ok && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Dados atualizados.
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome da banda</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Responsável</label>
          <input
            required
            value={form.responsible}
            onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Telefone</label>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
          <input
            required
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
      </div>
    </form>
  );
}

