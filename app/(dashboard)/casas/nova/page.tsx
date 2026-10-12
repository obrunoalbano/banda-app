import { VenueForm } from "@/components/VenueForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova casa de show" };

export default function NovaCasaPage() {
  return (
    <div className={containerClass}>
      <PageHeader title="Nova casa de show" back={{ href: "/casas", label: "Voltar à listagem" }} />
      <VenueForm mode="create" />
    </div>
  );
}
