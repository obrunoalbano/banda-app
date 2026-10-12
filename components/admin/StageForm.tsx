"use client";

import type { StageStatus, StageType } from "@/app/generated/prisma/enums";
import { CitySelectFields } from "@/components/CitySelectFields";
import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { PhoneField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { STAGE_TYPE_OPTIONS } from "@/lib/stages";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type StageFormData = {
  id: string;
  name: string;
  type: StageType;
  city: string;
  state: string;
  neighborhood: string | null;
  genres: string[];
  instagram: string | null;
  website: string | null;
  publicPhone: string | null;
  whatsapp: string | null;
  imageUrl: string | null;
  publicEmail: string | null;
  capacity: number | null;
  notes: string | null;
  sourceNote: string | null;
};

/**
 * Cadastro/edição de palco da base curada. Só dados INSTITUCIONAIS do estabelecimento
 * (nada de nome/telefone pessoal de responsável — LGPD, ver docs/modulos-marketing.md §4.3).
 */
export function StageForm({ mode, stage }: { mode: "create" | "edit"; stage?: StageFormData }) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [form, setForm] = useState({
    name: stage?.name ?? "",
    type: stage?.type ?? ("BAR" as StageType),
    state: stage?.state ?? "",
    city: stage?.city ?? "",
    neighborhood: stage?.neighborhood ?? "",
    genres: stage?.genres.join(", ") ?? "",
    instagram: stage?.instagram ?? "",
    website: stage?.website ?? "",
    publicPhone: stage?.publicPhone ?? "",
    whatsapp: stage?.whatsapp ?? "",
    imageUrl: stage?.imageUrl ?? "",
    publicEmail: stage?.publicEmail ?? "",
    capacity: stage?.capacity ? String(stage.capacity) : "",
    notes: stage?.notes ?? "",
    sourceNote: stage?.sourceNote ?? "",
    status: "DRAFT" as StageStatus,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { status, capacity, ...rest } = form;
    const body = {
      ...rest,
      capacity: capacity.trim() ? Number.parseInt(capacity, 10) : null,
      ...(mode === "create" && { status }),
    };
    const data = await submit<{ id: string }>(
      mode === "create" ? "/api/admin/stages" : `/api/admin/stages/${stage!.id}`,
      mode === "create" ? "POST" : "PATCH",
      body,
    );
    if (!data) return;
    router.push(`/admin/palcos/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nome do palco"
          className="sm:col-span-2"
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <SelectField label="Tipo" required value={form.type} onChange={(e) => set({ type: e.target.value as StageType })}>
          {STAGE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Capacidade (pessoas)"
          type="number"
          inputMode="numeric"
          min={1}
          value={form.capacity}
          onChange={(e) => set({ capacity: e.target.value })}
          hint="Opcional"
        />
        <CitySelectFields state={form.state} city={form.city} onChange={set} />
        <TextField
          label="Bairro/região"
          className="sm:col-span-2"
          value={form.neighborhood}
          onChange={(e) => set({ neighborhood: e.target.value })}
          hint="Opcional. Ex.: Vila Madalena, Lapa."
        />
        <TextField
          label="Estilos que programa"
          className="sm:col-span-2"
          value={form.genres}
          onChange={(e) => set({ genres: e.target.value })}
          placeholder="rock, pop, sertanejo"
          hint="Separados por vírgula."
        />
        <TextField
          label="Instagram"
          value={form.instagram}
          onChange={(e) => set({ instagram: e.target.value })}
          placeholder="@casa"
        />
        <TextField
          label="Site"
          type="url"
          value={form.website}
          onChange={(e) => set({ website: e.target.value })}
          placeholder="https://"
        />
        <PhoneField
          label="WhatsApp comercial"
          value={form.whatsapp}
          onValueChange={(whatsapp) => set({ whatsapp })}
          hint="Canal do estabelecimento — não cadastre número pessoal."
        />
        <PhoneField
          label="Telefone comercial"
          value={form.publicPhone}
          onValueChange={(publicPhone) => set({ publicPhone })}
        />
        <TextField
          label="Email comercial"
          type="email"
          value={form.publicEmail}
          onChange={(e) => set({ publicEmail: e.target.value })}
        />
        <TextField
          label="Imagem (URL)"
          className="sm:col-span-2"
          type="url"
          value={form.imageUrl}
          onChange={(e) => set({ imageUrl: e.target.value })}
          placeholder="https://"
        />
        <TextAreaField
          label="Programação e observações"
          className="sm:col-span-2"
          rows={3}
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Dias com música ao vivo, formatos que contrata, como prefere ser abordado…"
        />
        <TextAreaField
          label="Fonte da informação"
          className="sm:col-span-2"
          rows={2}
          value={form.sourceNote}
          onChange={(e) => set({ sourceNote: e.target.value })}
          placeholder="Ex.: Instagram oficial (out/2026), ligação para o bar"
          hint="Uso interno da curadoria (correções e pedidos de remoção). Não aparece para as bandas."
        />
        {mode === "create" ? (
          <SelectField
            label="Situação"
            className="sm:col-span-2"
            value={form.status}
            onChange={(e) => set({ status: e.target.value as StageStatus })}
            hint="Publicado aparece para as bandas no Explorar Palcos e conta como verificado agora."
          >
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado (já verificado)</option>
          </SelectField>
        ) : null}
      </div>
      <FormActions
        loading={loading}
        submitLabel={mode === "create" ? "Cadastrar palco" : "Salvar alterações"}
        cancelHref={mode === "create" ? "/admin/palcos" : `/admin/palcos/${stage!.id}`}
      />
    </form>
  );
}
