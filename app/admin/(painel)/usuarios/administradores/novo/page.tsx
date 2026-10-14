import { CreateAccountForm } from "@/components/admin/CreateAccountForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo administrador" };

export default async function NovoAdministradorPage() {
  await requireAdminId();
  return (
    <div className={containerClass}>
      <PageHeader
        title="Novo administrador"
        back={{ href: "/admin/usuarios/administradores", label: "Voltar aos administradores" }}
      />
      <CreateAccountForm kind="admin" />
    </div>
  );
}
