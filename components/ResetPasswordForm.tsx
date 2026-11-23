"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Nova senha a partir do link do email; ao concluir, volta ao login com aviso. */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { submit, loading, error, setError } = useJsonSubmit();
  const [form, setForm] = useState({ newPassword: "", confirm: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setError("A confirmação não confere com a nova senha.");
      return;
    }
    const data = await submit("/api/password/reset", "POST", { token, newPassword: form.newPassword });
    if (data) router.replace("/login?reset=1");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <PasswordField
        label="Nova senha"
        name="newPassword"
        autoComplete="new-password"
        minLength={8}
        required
        value={form.newPassword}
        onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
        hint="Mínimo de 8 caracteres"
      />
      <PasswordField
        label="Confirme a nova senha"
        name="confirm"
        autoComplete="new-password"
        minLength={8}
        required
        value={form.confirm}
        onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
      />
      <Button type="submit" loading={loading} className="mt-2 w-full">
        {loading ? "Salvando…" : "Salvar nova senha"}
      </Button>
    </form>
  );
}
