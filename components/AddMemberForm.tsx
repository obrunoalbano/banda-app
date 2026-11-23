"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { SelectField, TextField } from "@/components/ui/fields";
import { InviteIcon } from "@/components/ui/icons";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import type { BandRole } from "@/app/generated/prisma/enums";
import { BAND_ROLE_OPTIONS } from "@/lib/band-roles";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type InviteResult = { status: "linked" } | { status: "invited"; inviteUrl: string | null; emailSent: boolean };

/** Resultado do convite: acesso imediato (já tinha conta) ou link para criar a conta. */
export function InviteResultAlert({ result, email }: { result: InviteResult; email: string }) {
  if (result.status === "linked") {
    return (
      <Alert tone="success" title="Acesso liberado">
        {email} já tinha conta no app: a banda aparece para essa pessoa no próximo acesso.
      </Alert>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Alert tone={result.emailSent ? "success" : "warning"} title="Convite criado">
        {result.emailSent
          ? `Enviamos um email para ${email} com o link para criar a conta.`
          : `Não foi possível enviar o email para ${email}.`}{" "}
        {result.inviteUrl
          ? "Você também pode mandar o link abaixo (vale por 14 dias, uma única vez)."
          : "O link não pôde ser gerado agora. Tente “Novo link” na lista de integrantes em instantes."}
      </Alert>
      {result.inviteUrl ? (
        <CodeBlock label="Link do convite" copyable>
          {result.inviteUrl}
        </CodeBlock>
      ) : null}
    </div>
  );
}

/** Administrador adiciona integrante (nome, email, papel). */
export function AddMemberForm() {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const empty = { name: "", email: "", role: "VIEWER" as BandRole };
  const [form, setForm] = useState(empty);
  const [result, setResult] = useState<{ result: InviteResult; email: string } | null>(null);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const data = await submit<InviteResult>("/api/band/members", "POST", form, "Não foi possível adicionar.");
    if (!data) return;
    setResult({ result: data, email: form.email.trim().toLowerCase() });
    setForm(empty);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      {result ? <InviteResultAlert result={result.result} email={result.email} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Nome"
          required
          maxLength={120}
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        <TextField
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
        />
        <SelectField
          label="Acesso"
          className="sm:col-span-2"
          value={form.role}
          onChange={(e) => set({ role: e.target.value as BandRole })}
          hint="Administrador cria, altera e exclui tudo (inclusive integrantes). Visualizador só consulta."
        >
          {BAND_ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </SelectField>
      </div>
      <div>
        <Button type="submit" icon={InviteIcon} loading={loading}>
          Adicionar integrante
        </Button>
      </div>
    </form>
  );
}
