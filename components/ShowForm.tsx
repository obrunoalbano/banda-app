"use client";

import type { ShowPaymentStatus } from "@/app/generated/prisma/enums";
import { CitySelectFields } from "@/components/CitySelectFields";
import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { CurrencyField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { linkClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { SHOW_PAYMENT_OPTIONS } from "@/lib/show-payment-status";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ShowVenueOption = {
  id: string;
  name: string;
  city: string;
  state: string;
  valorCacheCents: number | null;
};

type ShowFormData = {
  id: string;
  venueId: string | null;
  date: string;
  time: string;
  privateEventDetails: string | null;
  privateCity: string | null;
  privateState: string | null;
  cacheCents: number | null;
  paymentStatus: ShowPaymentStatus;
};

type ShowFormProps = {
  mode: "create" | "edit";
  venues: ShowVenueOption[];
  show?: ShowFormData;
};

const PRIVATE_EVENT_VALUE = "__PRIVATE_EVENT__";

export function ShowForm({ mode, venues, show }: ShowFormProps) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  /** Enquanto o usuário não mexer no cachê, trocar de casa preenche com o cachê da casa. */
  const [cacheTouched, setCacheTouched] = useState(false);
  const [form, setForm] = useState({
    venueId: show == null ? "" : (show.venueId ?? PRIVATE_EVENT_VALUE),
    date: show?.date ?? "",
    time: show?.time ?? "",
    privateEventDetails: show?.privateEventDetails ?? "",
    privateCity: show?.privateCity ?? "",
    privateState: show?.privateState?.toUpperCase() ?? "",
    cacheCents: show?.cacheCents ?? null,
    paymentStatus: show?.paymentStatus ?? ("AGUARDANDO_PAGAMENTO" as ShowPaymentStatus),
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const isPrivateEvent = form.venueId === PRIVATE_EVENT_VALUE;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit<{ id: string }>(
      mode === "create" ? "/api/shows" : `/api/shows/${show!.id}`,
      mode === "create" ? "POST" : "PATCH",
      {
        venueId: isPrivateEvent ? null : form.venueId,
        date: form.date,
        time: form.time,
        privateEventDetails: isPrivateEvent ? form.privateEventDetails : null,
        privateCity: isPrivateEvent ? form.privateCity : null,
        privateState: isPrivateEvent ? form.privateState : null,
        cacheCents: form.cacheCents,
        paymentStatus: form.paymentStatus,
      },
    );
    if (!data) return;
    router.push(`/shows/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Casa de show"
          className="sm:col-span-2"
          required
          value={form.venueId}
          onChange={(e) => {
            const venueId = e.target.value;
            const venue = venues.find((v) => v.id === venueId);
            set({
              venueId,
              ...(venue && !cacheTouched && { cacheCents: venue.valorCacheCents }),
            });
          }}
          hint={
            venues.length === 0 ? (
              <>
                Nenhuma casa cadastrada. Use Evento Particular ou{" "}
                <Link href="/casas/nova" className={linkClass}>
                  cadastre uma casa
                </Link>
                .
              </>
            ) : undefined
          }
        >
          <option value="">Selecione a casa</option>
          <option value={PRIVATE_EVENT_VALUE}>Evento Particular</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} - {v.city}/{v.state}
            </option>
          ))}
        </SelectField>

        {isPrivateEvent && (
          <>
            <CitySelectFields
              state={form.privateState}
              city={form.privateCity}
              onChange={({ state, city }) => set({ privateState: state, privateCity: city })}
            />
            <TextAreaField
              label="Detalhes do evento particular"
              className="sm:col-span-2"
              rows={3}
              value={form.privateEventDetails}
              onChange={(e) => set({ privateEventDetails: e.target.value })}
              placeholder="Ex.: aniversário, casamento, local e observações (opcional)"
            />
          </>
        )}

        <TextField
          label="Data"
          type="date"
          required
          value={form.date}
          onChange={(e) => set({ date: e.target.value })}
        />
        <TextField
          label="Horário"
          type="time"
          step={60}
          required
          value={form.time}
          onChange={(e) => set({ time: e.target.value })}
        />
        <CurrencyField
          label="Cachê"
          className="sm:col-span-2"
          value={form.cacheCents}
          onValueChange={(cacheCents) => {
            setCacheTouched(true);
            set({ cacheCents });
          }}
          hint={
            !isPrivateEvent && form.venueId
              ? "Valor deste show. Alterar o cachê da casa depois não muda este valor."
              : undefined
          }
        />
        <SelectField
          label="Status de pagamento"
          className="sm:col-span-2"
          value={form.paymentStatus}
          onChange={(e) => set({ paymentStatus: e.target.value as ShowPaymentStatus })}
        >
          {SHOW_PAYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>
      <FormActions
        loading={loading}
        submitLabel={mode === "create" ? "Cadastrar show" : "Salvar alterações"}
        cancelHref={mode === "create" ? "/shows" : `/shows/${show!.id}`}
      />
    </form>
  );
}
