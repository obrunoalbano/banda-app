"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useState } from "react";

/** Pede o link de redefinição. A resposta é a mesma exista ou não a conta. */
export function ForgotPasswordForm() {
  const { submit, loading, error } = useJsonSubmit();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit("/api/password/forgot", "POST", { email }, "Não foi possível enviar. Tente novamente.");
    if (data) setSentTo(email.trim());
  }

  if (sentTo) {
    return (
      <Alert tone="success" title="Confira seu email">
        Se houver uma conta com <strong>{sentTo}</strong>, enviamos um link para criar uma nova senha. Ele vale por 1
        hora. Não chegou? Veja a caixa de spam ou tente de novo em alguns minutos.
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error ? <Alert>{error}</Alert> : null}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" loading={loading} className="mt-2 w-full">
        {loading ? "Enviando…" : "Enviar link"}
      </Button>
    </form>
  );
}
