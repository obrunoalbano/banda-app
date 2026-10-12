"use client";

import { FormActions } from "@/components/FormActions";
import { Alert } from "@/components/ui/Alert";
import { TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useState } from "react";

/** Troca da própria senha (banda: /api/band/password · superadmin: /api/admin/password). */
export function ChangePasswordForm({
  endpoint,
  forced,
  redirectTo,
}: {
  endpoint: string;
  /** Senha provisória: troca obrigatória antes de usar o app. */
  forced: boolean;
  /** Para onde ir depois de trocar. */
  redirectTo: string;
}) {
  const { submit, loading, error, setError } = useJsonSubmit();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    const data = await submit(endpoint, "POST", {
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    });
    if (!data) return;
    setDone(true);
    // Navegação completa (não router.push): o roteador guardou pré-carregamentos feitos enquanto a
    // senha era provisória (todos redirecionando para a troca de senha); recarregar usa a sessão nova.
    window.location.assign(redirectTo);
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      {forced ? (
        <Alert tone="warning" title="Defina uma nova senha">
          Você entrou com uma senha provisória. Crie a sua senha para continuar.
        </Alert>
      ) : null}
      {error ? <Alert>{error}</Alert> : null}
      {done ? <Alert tone="success">Senha alterada.</Alert> : null}
      <TextField
        label={forced ? "Senha provisória" : "Senha atual"}
        type="password"
        autoComplete="current-password"
        required
        value={form.currentPassword}
        onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
      />
      <TextField
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={form.newPassword}
        onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
        hint="Mínimo de 8 caracteres"
      />
      <TextField
        label="Confirme a nova senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={form.confirm}
        onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
      />
      <FormActions loading={loading} submitLabel="Salvar nova senha" cancelHref={forced ? undefined : redirectTo} />
    </form>
  );
}
