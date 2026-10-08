"use client";

import { Alert } from "@/components/ui/Alert";
import { PhoneField, TextField } from "@/components/ui/fields";
import { buttonPrimaryClass, linkClass } from "@/components/ui/styles";
import { useJsonSubmit } from "@/hooks/useJsonSubmit";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const { submit, loading, error } = useJsonSubmit();
  const [form, setForm] = useState({ name: "", responsible: "", phone: "", email: "", password: "" });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = await submit("/api/register", "POST", form, "Não foi possível cadastrar.");
    if (!data) return;
    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      {error && <Alert>{error}</Alert>}
      <TextField
        label="Nome da banda"
        required
        autoComplete="organization"
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
      />
      <TextField
        label="Responsável"
        required
        autoComplete="name"
        value={form.responsible}
        onChange={(e) => set({ responsible: e.target.value })}
      />
      <PhoneField label="Telefone" required value={form.phone} onValueChange={(phone) => set({ phone })} />
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={form.email}
        onChange={(e) => set({ email: e.target.value })}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={form.password}
        onChange={(e) => set({ password: e.target.value })}
        hint="Mínimo de 8 caracteres"
      />
      <button type="submit" disabled={loading} className={`mt-2 ${buttonPrimaryClass} py-2.5`}>
        {loading ? "Cadastrando…" : "Cadastrar banda"}
      </button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Já tem conta?{" "}
        <Link href="/login" className={linkClass}>
          Entrar
        </Link>
      </p>
    </form>
  );
}
