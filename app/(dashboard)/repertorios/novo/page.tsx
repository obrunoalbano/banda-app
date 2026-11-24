import { RepertoireForm } from "@/components/repertoire/RepertoireForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import { requireBandEditor } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo repertório" };

export default async function NovoRepertorioPage() {
  await requireBandEditor("/repertorios");
  return (
    <div className={containerClass}>
      <PageHeader title="Novo repertório" back={{ href: "/repertorios", label: "Voltar à listagem" }} />
      <RepertoireForm mode="create" />
    </div>
  );
}
