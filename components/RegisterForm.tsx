"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    responsible: "",
    phone: "",
    email: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Não foi possível cadastrar.");
      return;
    }
    router.push("/login?registered=1");
    router.refresh();
  }

  const inputClass =
    "rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nome da banda</label>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Responsável</label>
        <input
          required
          value={form.responsible}
          onChange={(e) => setForm((f) => ({ ...f, responsible: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Telefone</label>
        <input
          required
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
        <input
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Senha</label>
        <input
          required
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className={inputClass}
        />
        <span className="text-xs text-zinc-500">Mínimo de 8 caracteres</span>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Cadastrando…" : "Cadastrar banda"}
      </button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Entrar
        </Link>
      </p>
    </form>
  );
}
