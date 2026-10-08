"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { TextField } from "@/components/ui/fields";
import { buttonPrimaryClass, linkClass } from "@/components/ui/styles";

/** Evita open redirect; só paths relativos internos. */
function safeCallbackUrl(raw: string | null): string {
  const fallback = "/casas";
  if (!raw) return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  return t;
}

function messageForAuthError(error: string | null, code: string | null): string | null {
  if (!error) return null;
  if (code === "rate_limited") {
    return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
  }
  if (error === "CredentialsSignin" || error === "CallbackRouteError") {
    return "Email ou senha incorretos.";
  }
  return "Não foi possível entrar. Tente novamente.";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get("callbackUrl"));
  const registered = searchParams.get("registered") === "1";
  const urlAuthError = messageForAuthError(searchParams.get("error"), searchParams.get("code"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // `redirect: false` quebra em produção quando `data.url` vem relativo:
      // o next-auth faz `new URL(data.url)` e lança antes de devolver o resultado.
      await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        callbackUrl,
        redirect: true,
      });
    } catch {
      setError("Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
      {registered && <Alert tone="success">Cadastro concluído. Faça login com seu email e senha.</Alert>}
      {(error ?? urlAuthError) && <Alert>{error ?? urlAuthError}</Alert>}
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Senha"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading} className={`mt-2 ${buttonPrimaryClass} py-2.5`}>
        {loading ? "Entrando…" : "Entrar"}
      </button>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className={linkClass}>
          Cadastre sua banda
        </Link>
      </p>
    </form>
  );
}
