import { CreateAccountForm } from "@/components/admin/CreateAccountForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova banda" };

export default async function NovaBandaPage() {
  await requireAdminId();
  return (
    <div className={containerClass}>
      <PageHeader title="Nova banda" back={{ href: "/admin/usuarios/bandas", label: "Voltar às bandas" }} />
      <CreateAccountForm kind="band" />
    </div>
  );
}
