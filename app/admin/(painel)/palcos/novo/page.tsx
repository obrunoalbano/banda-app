import { StageForm } from "@/components/admin/StageForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { requireAdminId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo palco" };

export default async function NovoPalcoPage() {
  await requireAdminId();
  return (
    <div className={containerClass}>
      <PageHeader title="Novo palco" back={{ href: "/admin/palcos", label: "Voltar aos palcos" }} />
      <StageForm mode="create" />
    </div>
  );
}
