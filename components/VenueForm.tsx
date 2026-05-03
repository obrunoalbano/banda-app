"use client";

import type { Venue } from "@/app/generated/prisma/client";
import { BRAZIL_UFS } from "@/lib/brazil-states";
import { SEND_STATUS_OPTIONS } from "@/lib/send-status";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type VenueFormProps = {
  mode: "create" | "edit";
  venue?: Venue;
};

export function VenueForm({ mode, venue }: VenueFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: venue?.name ?? "",
    responsible: venue?.responsible ?? "",
    phone: venue?.phone ?? "",
    email: venue?.email ?? "",
    city: venue?.city ?? "",
    state: venue?.state?.toUpperCase() ?? "",
    instagram: venue?.instagram ?? "",
    valorCache: venue?.valorCache ?? null,
    sendStatus: venue?.sendStatus ?? ("NAO_ENVIADO" as Venue["sendStatus"]),
  });

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

  useEffect(() => {
    const uf = form.state.trim().toUpperCase();
    if (uf.length !== 2) {
      setCities([]);
      return;
    }
    const ac = new AbortController();
    setLoadingCities(true);
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`,
      { signal: ac.signal },
    )
      .then((r) => {
        if (!r.ok) throw new Error("ibge");
        return r.json() as Promise<{ nome: string }[]>;
      })
      .then((data) =>
        setCities(data.map((m) => m.nome).sort((a, b) => a.localeCompare(b, "pt-BR"))),
      )
      .catch(() => {
        if (!ac.signal.aborted) setCities([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoadingCities(false);
      });
    return () => ac.abort();
  }, [form.state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const payload = {
      name: form.name,
      responsible: form.responsible,
      phone: form.phone,
      email: form.email,
      city: form.city,
      state: form.state.trim().toUpperCase(),
      instagram: form.instagram || null,
      valorCache:
        form.valorCache !== null && form.valorCache !== undefined && Number.isFinite(form.valorCache)
          ? form.valorCache
          : null,
      sendStatus: form.sendStatus,
    };

    const url = mode === "create" ? "/api/venues" : `/api/venues/${venue!.id}`;
    const res = await fetch(url, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar.");
      return;
    }
    router.push(`/casas/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome da casa</label>
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
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Estado</label>
          <select
            required
            value={form.state}
            onChange={(e) => {
              const state = e.target.value;
              setForm((f) => ({ ...f, state, city: "" }));
            }}
            className={inputClass}
          >
            <option value="">Selecione o estado</option>
            {BRAZIL_UFS.map((s) => (
              <option key={s.sigla} value={s.sigla}>
                {s.nome} ({s.sigla})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Cidade</label>
          <select
            required
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className={inputClass}
            disabled={!form.state || loadingCities}
          >
            <option value="">
              {!form.state
                ? "Selecione o estado primeiro"
                : loadingCities
                  ? "Carregando cidades…"
                  : "Selecione a cidade"}
            </option>
            {form.city && !cities.includes(form.city) && (
              <option value={form.city}>{form.city}</option>
            )}
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Instagram</label>
          <input
            value={form.instagram}
            onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            className={inputClass}
            placeholder="@casa ou URL"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Valor do cachê (R$)
          </label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={form.valorCache == null ? "" : form.valorCache}
            onChange={(e) => {
              const raw = e.target.value;
              setForm((f) => ({
                ...f,
                valorCache: raw === "" ? null : Number.parseFloat(raw),
              }));
            }}
            className={inputClass}
            placeholder="Opcional"
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status de envio
          </label>
          <select
            value={form.sendStatus}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                sendStatus: e.target.value as Venue["sendStatus"],
              }))
            }
            className={inputClass}
          >
            {SEND_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Salvando…" : mode === "create" ? "Cadastrar casa" : "Salvar alterações"}
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
