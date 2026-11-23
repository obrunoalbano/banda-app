import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { AuthLayout } from "@/components/ui/AuthLayout";
import { linkClass } from "@/components/ui/styles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <AuthLayout
      title="Esqueci minha senha"
      description="Informe o email da sua banda. Enviaremos um link para você criar uma nova senha."
      footer={
        <>
          Lembrou a senha?{" "}
          <Link href="/login" className={linkClass}>
            Entrar
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
