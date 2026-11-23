"use client";

import type { FinanceCategory, FinanceEntryType } from "@/app/generated/prisma/enums";
import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { CheckboxField, CurrencyField, SelectField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import {
  FINANCE_CATEGORIES_BY_TYPE,
  FINANCE_CATEGORY_LABELS,
  FINANCE_TYPE_OPTIONS,
  isCategoryAllowed,
} from "@/lib/finance-categories";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type FinanceEntryFormData = {
  id: string;
  type: FinanceEntryType;
  category: FinanceCategory;
  description: string;
  amountCents: number;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD ou null (pendente). */
  paidAt: string | null;
  showId: string | null;
};

type ShowOption = { id: string; label: string };

export function FinanceEntryForm({
  mode,
  entry,
  shows,
  defaults,
  returnTo,
}: {
  mode: "create" | "edit";
  entry?: FinanceEntryFormData;
  shows: ShowOption[];
  /** Pré-preenchimento na criação (ex.: "Adicionar despesa" no show). */
  defaults?: { type?: FinanceEntryType; showId?: string; date?: string };
  /** Para onde voltar depois de salvar/cancelar. */
  returnTo: string;
}) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const initialType = entry?.type ?? defaults?.type ?? "DESPESA";
  const [form, setForm] = useState({
    type: initialType,
    category: entry?.category ?? ("" as FinanceCategory | ""),
    description: entry?.description ?? "",
    amountCents: entry?.amountCents ?? (null as number | null),
    date: entry?.date ?? defaults?.date ?? "",
    paid: entry ? entry.paidAt !== null : false,
    paidAt: entry?.paidAt ?? "",
    showId: entry?.showId ?? defaults?.showId ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const isExpense = form.type === "DESPESA";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit<{ id: string }>(
      mode === "create" ? "/api/finance-entries" : `/api/finance-entries/${entry!.id}`,
      mode === "create" ? "POST" : "PATCH",
      {
        type: form.type,
        category: form.category,
        description: form.description,
        amountCents: form.amountCents,
        date: form.date,
        // Pago sem data = pago na data do lançamento.
        paidAt: form.paid ? form.paidAt || form.date : null,
        showId: form.showId || null,
      },
    );
    if (!data) return;
    router.push(returnTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Tipo"
          required
          value={form.type}
          onChange={(e) => {
            const type = e.target.value as FinanceEntryType;
            set({ type, ...(form.category && !isCategoryAllowed(type, form.category) && { category: "" }) });
          }}
        >
          {FINANCE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Categoria"
          required
          value={form.category}
          onChange={(e) => set({ category: e.target.value as FinanceCategory })}
        >
          <option value="">Selecione</option>
          {FINANCE_CATEGORIES_BY_TYPE[form.type].map((c) => (
            <option key={c} value={c}>
              {FINANCE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Descrição"
          className="sm:col-span-2"
          required
          maxLength={200}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder={isExpense ? "Ex.: Van ida e volta" : "Ex.: Camisetas vendidas no show"}
        />
        <CurrencyField
          label="Valor"
          required
          value={form.amountCents}
          onValueChange={(amountCents) => set({ amountCents })}
        />
        <TextField
          label={isExpense ? "Data (ou vencimento)" : "Data prevista"}
          type="date"
          required
          value={form.date}
          onChange={(e) => set({ date: e.target.value })}
        />
        <SelectField
          label="Show relacionado"
          className="sm:col-span-2"
          value={form.showId}
          onChange={(e) => set({ showId: e.target.value })}
          hint="Opcional. Entra no resultado do show."
        >
          <option value="">Nenhum (lançamento avulso)</option>
          {shows.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </SelectField>
      </div>

      <fieldset className="flex flex-col gap-4 rounded-lg border border-line p-4">
        <legend className="px-1 text-sm font-semibold text-fg">Pagamento</legend>
        <CheckboxField
          label={isExpense ? "Já foi pago" : "Já foi recebido"}
          checked={form.paid}
          onChange={(e) => set({ paid: e.target.checked })}
          hint="Desmarcado, fica como pendente (e atrasado depois da data)."
        />
        {form.paid ? (
          <TextField
            label={isExpense ? "Pago em" : "Recebido em"}
            type="date"
            value={form.paidAt}
            onChange={(e) => set({ paidAt: e.target.value })}
            hint="Vazio = mesma data do lançamento."
          />
        ) : null}
      </fieldset>

      <FormActions
        loading={loading}
        submitLabel={mode === "create" ? "Salvar lançamento" : "Salvar alterações"}
        cancelHref={returnTo}
      />
    </form>
  );
}
