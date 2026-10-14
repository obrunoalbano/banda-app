"use client";

import { TempPasswordReveal } from "@/components/admin/TempPasswordReveal";
import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { PhoneField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Created = { id: string; email: string; tempPassword: string };

/**
 * Cria conta (banda ou administrador) com senha provisória gerada no servidor.
 * Depois de criar, mostra a senha UMA vez e links para seguir.
 */
export function CreateAccountForm({ kind }: { kind: "band" | "admin" }) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [created, setCreated] = useState<Created | null>(null);
  const [form, setForm] = useState({ name: "", responsible: "", phone: "", email: "" });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const listHref = kind === "band" ? "/admin/usuarios/bandas" : "/admin/usuarios/administradores";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = kind === "band" ? form : { name: form.name, email: form.email };
    const data = await submit<Created>(kind === "band" ? "/api/admin/bands" : "/api/admin/admins", "POST", body);
    if (!data) return;
    setCreated(data);
    router.refresh();
  }

  if (created) {
    return (
      <div className="flex max-w-xl flex-col gap-5">
        <Alert tone="success">{kind === "band" ? "Conta da banda criada." : "Administrador criado."}</Alert>
        <TempPasswordReveal email={created.email} password={created.tempPassword} />
        <div className="flex flex-wrap gap-3">
          {kind === "band" ? (
            <ButtonLink href={`/admin/usuarios/bandas/${created.id}`}>Ver banda</ButtonLink>
          ) : null}
          <ButtonLink href={listHref} variant="secondary">
            Voltar à lista
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={kind === "band" ? "Nome da banda" : "Nome"}
          className="sm:col-span-2"
          required
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
        />
        {kind === "band" ? (
          <>
            <TextField
              label="Responsável"
              required
              value={form.responsible}
              onChange={(e) => set({ responsible: e.target.value })}
            />
            <PhoneField label="Telefone" required value={form.phone} onValueChange={(phone) => set({ phone })} />
          </>
        ) : null}
        <TextField
          label="Email de acesso"
          className="sm:col-span-2"
          type="email"
          required
          value={form.email}
          onChange={(e) => set({ email: e.target.value })}
          hint="Uma senha provisória será gerada; no primeiro acesso a pessoa cria a própria senha."
        />
      </div>
      <FormActions
        loading={loading}
        submitLabel={kind === "band" ? "Criar conta da banda" : "Criar administrador"}
        cancelHref={listHref}
      />
    </form>
  );
}
