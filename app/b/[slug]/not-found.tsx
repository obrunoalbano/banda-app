import { ButtonLink } from "@/components/ui/Button";
import { PRODUCT_NAME } from "@/components/ui/Brand";
import { NotFoundIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";

export default function PublicAgendaNotFound() {
  return (
    <StatusPage
      icon={NotFoundIcon}
      title="Agenda não encontrada"
      description="O endereço pode estar errado ou a banda desativou a agenda pública."
      actions={<ButtonLink href="/" variant="secondary">Conhecer o {PRODUCT_NAME}</ButtonLink>}
    />
  );
}
