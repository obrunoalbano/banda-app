import { RegisterForm } from "@/components/RegisterForm";
import { AuthLayout } from "@/components/ui/AuthLayout";
import { linkClass } from "@/components/ui/styles";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Cadastrar banda" };

export default function CadastroPage() {
  return (
    <AuthLayout
      title="Cadastre sua banda"
      description="O email e a senha serão usados para entrar."
      footer={
        <>
          Já tem conta?{" "}
          <Link href="/login" className={linkClass}>
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
