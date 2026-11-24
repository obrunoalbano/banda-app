"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PasswordField, PhoneField, TextField } from "@/components/ui/fields";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Convite válido (cadastro pelo link enviado por uma banda). */
export type RegisterInvite = { token: string; email: string; name: string; bandName: string };

/** Link de convite da banda (grupo): qualquer email, entra na banda do link. */
export type RegisterBandLink = { token: string; bandName: string };

export function RegisterForm({ invite, bandLink }: { invite?: RegisterInvite; bandLink?: RegisterBandLink }) {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [form, setForm] = useState({
    name: invite?.name ?? "",
    phone: "",
    email: invite?.email ?? "",
    password: "",
    bandName: "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const account = { name: form.name, phone: form.phone, email: form.email, password: form.password };
    const body = invite
      ? { ...account, inviteToken: invite.token }
      : bandLink
        ? { ...account, bandLinkToken: bandLink.token }
        : form;
    const data = await submit("/api/register", "POST", body, "Não foi possível cadastrar.");
    if (!data) return;
    const params = new URLSearchParams({ registered: "1", email: form.email.trim().toLowerCase() });
    router.push(`/login?${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <TextField
        label="Seu nome"
        required
        autoComplete="name"
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
      />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        readOnly={!!invite}
        value={form.email}
        onChange={(e) => set({ email: e.target.value })}
        hint={invite ? "O convite vale para este email." : "Você vai usar o email e a senha para entrar."}
      />
      <PhoneField label="Telefone (opcional)" value={form.phone} onValueChange={(phone) => set({ phone })} />
      <PasswordField
        label="Senha"
        autoComplete="new-password"
        minLength={8}
        required
        value={form.password}
        onChange={(e) => set({ password: e.target.value })}
        hint="Mínimo de 8 caracteres"
      />
      {invite || bandLink ? null : (
        <TextField
          label="Nome da banda"
          required
          autoComplete="organization"
          value={form.bandName}
          onChange={(e) => set({ bandName: e.target.value })}
          hint="Você poderá criar outras bandas e convidar os integrantes depois."
        />
      )}
      <Button type="submit" loading={loading} className="mt-2 w-full">
        {loading
          ? "Cadastrando…"
          : invite || bandLink
            ? `Criar conta e entrar na ${(invite ?? bandLink)!.bandName}`
            : "Criar conta"}
      </Button>
    </form>
  );
}
