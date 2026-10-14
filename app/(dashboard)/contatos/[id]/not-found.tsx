import { ButtonLink } from "@/components/ui/Button";
import { BackIcon, NotFoundIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";

export default function ContatoNotFound() {
  return (
    <StatusPage
      icon={NotFoundIcon}
      title="Contato não encontrado"
      description="Ele pode ter sido removido ou não pertence à sua banda."
      actions={
        <ButtonLink href="/contatos" variant="secondary" icon={BackIcon}>
          Voltar aos contatos
        </ButtonLink>
      }
    />
  );
}
