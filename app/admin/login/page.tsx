import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AuthLayout } from "@/components/ui/AuthLayout";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Painel administrativo", robots: { index: false, follow: false } };

/** Login da equipe (superadmin). Contas de banda entram por /login. */
export default function AdminLoginPage() {
  return (
    <AuthLayout
      title="Painel administrativo"
      description="Acesso restrito à equipe da Agenda da banda."
    >
      <AdminLoginForm />
    </AuthLayout>
  );
}
