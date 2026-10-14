import { Badge } from "@/components/ui/Badge";

/** Situação da conta (banda ou administrador). */
export function AccountStatus({ disabled, provisional }: { disabled: boolean; provisional: boolean }) {
  if (disabled) return <Badge tone="danger">Desativada</Badge>;
  if (provisional) return <Badge tone="warning">Senha provisória</Badge>;
  return <Badge tone="success">Ativa</Badge>;
}
