import { ButtonLink } from "@/components/ui/Button";
import { BackIcon, NotFoundIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";

export default function ShowNotFound() {
  return (
    <StatusPage
      icon={NotFoundIcon}
      title="Show não encontrado"
      description="Ele pode ter sido removido ou não pertence à sua banda."
      actions={
        <ButtonLink href="/shows" variant="secondary" icon={BackIcon}>
          Voltar aos shows
        </ButtonLink>
      }
    />
  );
}
