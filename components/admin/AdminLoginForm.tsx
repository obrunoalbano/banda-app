"use client";

import { adminLogin, type AdminLoginState } from "@/app/admin/login/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { useActionState } from "react";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(adminLogin, { error: null, email: "" });
  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? <Alert>{state.error}</Alert> : null}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        required
        defaultValue={state.email}
      />
      <TextField label="Senha" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" loading={pending} className="mt-2 w-full">
        {pending ? "Entrando…" : "Entrar no painel"}
      </Button>
    </form>
  );
}
