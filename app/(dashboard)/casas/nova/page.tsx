import { VenueForm } from "@/components/VenueForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { containerClass } from "@/components/ui/styles";

export default function NovaCasaPage() {
  return (
    <div className={containerClass}>
      <PageHeader title="Nova casa de show" back={{ href: "/casas", label: "Voltar à listagem" }} />
      <VenueForm mode="create" />
    </div>
  );
}
