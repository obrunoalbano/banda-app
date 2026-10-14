import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { getSession, requireAdminId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Alterar senha" };

export default async function AdminSenhaPage() {
  await requireAdminId();
  const forced = (await getSession())?.user.mustChangePassword ?? false;
  return (
    <div className={containerClass}>
      <PageHeader title="Alterar senha" eyebrow="Painel" />
      <ChangePasswordForm endpoint="/api/admin/password" forced={forced} redirectTo="/admin/palcos" />
    </div>
  );
}
