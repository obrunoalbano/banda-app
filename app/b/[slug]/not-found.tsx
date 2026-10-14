import { ButtonLink } from "@/components/ui/Button";
import { NotFoundIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";

export default function PublicAgendaNotFound() {
  return (
    <StatusPage
      icon={NotFoundIcon}
      title="Agenda não encontrada"
      description="O endereço pode estar errado ou a banda desativou a agenda pública."
      actions={<ButtonLink href="/" variant="secondary">Conhecer a Agenda da banda</ButtonLink>}
    />
  );
}
