"use client";

import type { RehearsalRecurrence } from "@/app/generated/prisma/enums";
import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { linkClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { RECURRENCE_OPTIONS, recurrenceDescription } from "@/lib/rehearsals";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type RehearsalFormData = {
  id: string;
  name: string;
  description: string | null;
  location: string;
  /** YYYY-MM-DD */
  date: string;
  time: string;
  recurrence: RehearsalRecurrence;
  /** YYYY-MM-DD ou null */
  recurrenceUntil: string | null;
  repertoireId: string | null;
};

type RepertoireOption = { id: string; name: string; songs: number };

/** Cadastro/edição de ensaio. Na criação, os integrantes são avisados e confirmam presença. */
export function RehearsalForm({
  mode,
  rehearsal,
  repertoires,
}: {
  mode: "create" | "edit";
  rehearsal?: RehearsalFormData;
  repertoires: RepertoireOption[];
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [form, setForm] = useState({
    name: rehearsal?.name ?? "",
    description: rehearsal?.description ?? "",
    location: rehearsal?.location ?? "",
    date: rehearsal?.date ?? "",
    time: rehearsal?.time ?? "",
    recurrence: rehearsal?.recurrence ?? ("NONE" as RehearsalRecurrence),
    recurrenceUntil: rehearsal?.recurrenceUntil ?? "",
    repertoireId: rehearsal?.repertoireId ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const recurring = form.recurrence !== "NONE";
  const preview =
    recurring && /^\d{4}-\d{2}-\d{2}$/.test(form.date)
      ? recurrenceDescription(form.recurrence, new Date(`${form.date}T00:00:00Z`))
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit<{ id: string }>(
      mode === "create" ? "/api/rehearsals" : `/api/rehearsals/${rehearsal!.id}`,
      mode === "create" ? "POST" : "PATCH",
      {
        ...form,
        recurrenceUntil: recurring ? form.recurrenceUntil || null : null,
        repertoireId: form.repertoireId || null,
      },
    );
    if (!data) return;
    router.push(`/ensaios/${mode === "create" ? data.id : rehearsal!.id}${mode === "create" ? "?criado=1" : ""}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <TextField
        label="Nome"
        required
        maxLength={120}
        placeholder="Ex.: Ensaio geral para o show de sábado"
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
      />
      <TextAreaField
        label="Descrição"
        rows={2}
        maxLength={1000}
        value={form.description}
        onChange={(e) => set({ description: e.target.value })}
        hint="Opcional. Ex.: levar o pedal novo, passar as músicas novas primeiro."
      />
      <TextField
        label="Local"
        required
        maxLength={200}
        placeholder="Ex.: Estúdio Som Livre, sala 2"
        value={form.location}
        onChange={(e) => set({ location: e.target.value })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={recurring ? "Data do primeiro ensaio" : "Data"}
          type="date"
          required
          value={form.date}
          onChange={(e) => set({ date: e.target.value })}
        />
        <TextField
          label="Horário"
          type="time"
          required
          value={form.time}
          onChange={(e) => set({ time: e.target.value })}
        />
        <SelectField
          label="Repetição"
          value={form.recurrence}
          onChange={(e) => set({ recurrence: e.target.value as RehearsalRecurrence })}
          hint={preview ?? "Ensaio recorrente: o dia da semana (ou do mês) vem da data."}
        >
          {RECURRENCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        {recurring ? (
          <TextField
            label="Repetir até"
            type="date"
            min={form.date || undefined}
            value={form.recurrenceUntil}
            onChange={(e) => set({ recurrenceUntil: e.target.value })}
            hint="Vazio = sem data para acabar."
          />
        ) : null}
      </div>
      <SelectField
        label="Repertório"
        value={form.repertoireId}
        onChange={(e) => set({ repertoireId: e.target.value })}
        hint={
          repertoires.length === 0 ? (
            <>
              Nenhum repertório ainda.{" "}
              <Link href="/repertorios/novo" className={linkClass}>
                Criar repertório
              </Link>
            </>
          ) : (
            "Músicas a ensaiar (opcional)."
          )
        }
      >
        <option value="">Sem repertório</option>
        {repertoires.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.songs} {r.songs === 1 ? "música" : "músicas"})
          </option>
        ))}
      </SelectField>
      {mode === "create" ? (
        <Alert tone="info">Ao criar, os integrantes recebem um aviso por email e confirmam presença pelo app.</Alert>
      ) : null}
      <FormActions
        loading={loading}
        submitLabel={mode === "create" ? "Criar ensaio e avisar integrantes" : "Salvar alterações"}
        cancelHref={rehearsal ? `/ensaios/${rehearsal.id}` : "/ensaios"}
      />
    </form>
  );
}
