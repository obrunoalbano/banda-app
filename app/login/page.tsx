import { LoginForm } from "@/components/LoginForm";
import { AuthLayout } from "@/components/ui/AuthLayout";
import { linkClass } from "@/components/ui/styles";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <AuthLayout
      title="Entrar"
      description="Use o email e a senha cadastrados para sua banda."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className={linkClass}>
            Cadastre sua banda
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-sm text-fg-subtle" aria-live="polite">Carregando…</p>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
