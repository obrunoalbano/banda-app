import { ButtonLink } from "@/components/ui/Button";
import { NotFoundIcon } from "@/components/ui/icons";
import { StatusPage } from "@/components/ui/StatusPage";

export default function NotFound() {
  return (
    <StatusPage
      icon={NotFoundIcon}
      title="Página não encontrada"
      description="O endereço pode estar errado ou a página foi removida."
      actions={<ButtonLink href="/">Ir para o início</ButtonLink>}
    />
  );
}
