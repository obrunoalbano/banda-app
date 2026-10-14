import { ButtonLink } from "@/components/ui/Button";
import { BackIcon, NotFoundIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";

export default function CasaNotFound() {
  return (
    <StatusPage
      icon={NotFoundIcon}
      title="Casa não encontrada"
      description="Ela pode ter sido removida ou não pertence à sua banda."
      actions={
        <ButtonLink href="/casas" variant="secondary" icon={BackIcon}>
          Voltar às casas
        </ButtonLink>
      }
    />
  );
}
