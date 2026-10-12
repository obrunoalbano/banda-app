"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PhoneField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useState } from "react";

const EVENT_TYPES = ["Casamento", "Aniversário", "Formatura", "Evento corporativo", "Bar ou restaurante", "Outro"];

const EMPTY = {
  name: "",
  email: "",
  whatsapp: "",
  eventDate: "",
  city: "",
  eventType: "",
  eventDescription: "",
};

/**
 * Formulário público de pedido de orçamento (página /b/<slug>/contato e widget).
 * Anti-spam: `formToken` (emitido no servidor ao renderizar) + campo-isca `website` invisível.
 */
export function PublicLeadForm({
  slug,
  formToken,
  source,
  compact,
}: {
  slug: string;
  formToken: string;
  /** Origem registrada no lead (ex.: "formulario-publico", "widget"). */
  source: string;
  compact?: boolean;
}) {
  const { submit, loading, error } = useJsonSubmit();
  const [form, setForm] = useState(EMPTY);
  const [honeypot, setHoneypot] = useState("");
  const [sent, setSent] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit(
      `/api/public/v1/bands/${slug}/leads`,
      "POST",
      { ...form, source, formToken, website: honeypot },
      "Não foi possível enviar. Tente novamente.",
    );
    if (data) setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4">
        <Alert tone="success" title="Pedido enviado!">
          Recebemos sua mensagem. A banda vai entrar em contato pelo email ou WhatsApp informado.
        </Alert>
        <Button
          variant="secondary"
          onClick={() => {
            setForm(EMPTY);
            setSent(false);
          }}
        >
          Enviar outro pedido
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "flex flex-col gap-3" : "flex flex-col gap-4"}>
      {error ? <Alert>{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Seu nome"
          className="sm:col-span-2"
          required
          autoComplete="name"
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <TextField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <PhoneField label="WhatsApp" value={form.whatsapp} onValueChange={(whatsapp) => set({ whatsapp })} />
        <TextField
          label="Data do evento"
          type="date"
          value={form.eventDate}
          onChange={(e) => set({ eventDate: e.target.value })}
        />
        <TextField
          label="Cidade"
          autoComplete="address-level2"
          value={form.city}
          onChange={(e) => set({ city: e.target.value })}
        />
        <SelectField
          label="Tipo de evento"
          className="sm:col-span-2"
          value={form.eventType}
          onChange={(e) => set({ eventType: e.target.value })}
        >
          <option value="">Selecione</option>
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </SelectField>
        <TextAreaField
          label="Conte sobre o evento"
          className="sm:col-span-2"
          rows={compact ? 3 : 4}
          maxLength={8000}
          placeholder="Local, número de convidados, duração, repertório…"
          value={form.eventDescription}
          onChange={(e) => set({ eventDescription: e.target.value })}
        />
      </div>

      {/* Campo-isca: invisível para pessoas; robôs costumam preencher. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`website-${slug}`}>Não preencha este campo</label>
        <input
          id={`website-${slug}`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div>
        <Button type="submit" loading={loading} className="w-full sm:w-auto">
          {loading ? "Enviando…" : "Pedir orçamento"}
        </Button>
        <p className="mt-2 text-xs text-fg-subtle">Seus dados são enviados só para a banda.</p>
      </div>
    </form>
  );
}
