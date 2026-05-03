"use client";

import type { ShowPaymentStatus } from "@/app/generated/prisma/enums";
import { BRAZIL_UFS } from "@/lib/brazil-states";
import { SHOW_PAYMENT_OPTIONS } from "@/lib/show-payment-status";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type ShowVenueOption = { id: string; name: string; city: string; state: string };
type ShowFormData = {
  id: string;
  venueId: string | null;
  date: string;
  time: string;
  privateEventDetails?: string | null;
  privateCity?: string | null;
  privateState?: string | null;
  privateValorCache?: number | null;
  paymentStatus: ShowPaymentStatus;
};

type ShowFormProps = {
  mode: "create" | "edit";
  venues: ShowVenueOption[];
  show?: ShowFormData;
};

const inputClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";
const PRIVATE_EVENT_VALUE = "__PRIVATE_EVENT__";

export function ShowForm({ mode, venues, show }: ShowFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const initialVenueSelect = show == null ? "" : (show.venueId ?? PRIVATE_EVENT_VALUE);

  const [form, setForm] = useState({
    venueId: initialVenueSelect,
    date: show?.date ?? "",
    time: show?.time ?? "",
    privateEventDetails: show?.privateEventDetails ?? "",
    privateCity: show?.privateCity ?? "",
    privateState: show?.privateState?.toUpperCase() ?? "",
    privateValorCache: show?.privateValorCache ?? null,
    paymentStatus: show?.paymentStatus ?? ("AGUARDANDO_PAGAMENTO" as ShowPaymentStatus),
  });

  const isPrivateEvent = form.venueId === PRIVATE_EVENT_VALUE;

  useEffect(() => {
    if (!isPrivateEvent) {
      setCities([]);
      return;
    }
    const uf = form.privateState.trim().toUpperCase();
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
  }, [form.privateState, isPrivateEvent]);

  const payload = useMemo(
    () => ({
      venueId: isPrivateEvent ? null : form.venueId,
      date: form.date,
      time: form.time,
      privateEventDetails: isPrivateEvent ? form.privateEventDetails.trim() || null : null,
      privateCity: isPrivateEvent ? form.privateCity.trim() || null : null,
      privateState: isPrivateEvent ? form.privateState.trim().toUpperCase() || null : null,
      privateValorCache: isPrivateEvent
        ? form.privateValorCache !== null &&
          form.privateValorCache !== undefined &&
          Number.isFinite(form.privateValorCache)
          ? form.privateValorCache
          : null
        : null,
      paymentStatus: form.paymentStatus,
    }),
    [form, isPrivateEvent],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const url = mode === "create" ? "/api/shows" : `/api/shows/${show!.id}`;
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
    router.push(`/shows/${data.id}`);
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
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Casa de show</label>
          <select
            required
            value={form.venueId}
            onChange={(e) => setForm((f) => ({ ...f, venueId: e.target.value }))}
            className={inputClass}
          >
            <option value="">Selecione a casa</option>
            <option value={PRIVATE_EVENT_VALUE}>Evento Particular</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} - {v.city}/{v.state}
              </option>
            ))}
          </select>
          {venues.length === 0 && (
            <p className="text-xs text-zinc-500">
              Nenhuma casa cadastrada. Use Evento Particular ou{" "}
              <Link href="/casas/nova" className="font-medium underline">
                cadastre uma casa
              </Link>
              .
            </p>
          )}
        </div>

        {isPrivateEvent && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Estado (UF)</label>
              <select
                required
                value={form.privateState}
                onChange={(e) => {
                  const privateState = e.target.value;
                  setForm((f) => ({ ...f, privateState, privateCity: "" }));
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
                value={form.privateCity}
                onChange={(e) => setForm((f) => ({ ...f, privateCity: e.target.value }))}
                className={inputClass}
                disabled={!form.privateState || loadingCities}
              >
                <option value="">
                  {!form.privateState
                    ? "Selecione o estado primeiro"
                    : loadingCities
                      ? "Carregando cidades…"
                      : "Selecione a cidade"}
                </option>
                {form.privateCity && !cities.includes(form.privateCity) && (
                  <option value={form.privateCity}>{form.privateCity}</option>
                )}
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
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
                value={form.privateValorCache == null ? "" : form.privateValorCache}
                onChange={(e) => {
                  const raw = e.target.value;
                  setForm((f) => ({
                    ...f,
                    privateValorCache: raw === "" ? null : Number.parseFloat(raw),
                  }));
                }}
                className={inputClass}
                placeholder="Opcional"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Detalhes do evento particular
              </label>
              <textarea
                rows={3}
                value={form.privateEventDetails}
                onChange={(e) => setForm((f) => ({ ...f, privateEventDetails: e.target.value }))}
                className={inputClass}
                placeholder="Ex.: aniversário, casamento, local e observações (opcional)"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Horário</label>
          <input
            required
            type="time"
            step={60}
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status de pagamento
          </label>
          <select
            value={form.paymentStatus}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                paymentStatus: e.target.value as ShowPaymentStatus,
              }))
            }
            className={inputClass}
          >
            {SHOW_PAYMENT_OPTIONS.map((o) => (
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
          {loading ? "Salvando…" : mode === "create" ? "Cadastrar show" : "Salvar alterações"}
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
