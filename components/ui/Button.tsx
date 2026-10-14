import Link from "next/link";
import type { Icon } from "./icons";
import { SpinnerIcon } from "./icons";
import { buttonClass, cx, type ButtonSize, type ButtonVariant } from "./styles";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícone à esquerda do texto (16px). */
  icon?: Icon;
  className?: string;
  children: React.ReactNode;
};

type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    /** Mostra spinner, desabilita e mantém a largura estável. */
    loading?: boolean;
  };

/**
 * Botão do sistema. Um único `primary` por tela/área de ação.
 * `type` padrão é "button" — passe `type="submit"` em formulários.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon: IconCmp,
  loading,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClass(variant, size), className)}
      {...props}
    >
      {loading ? <SpinnerIcon className="animate-spin" aria-hidden /> : IconCmp ? <IconCmp aria-hidden /> : null}
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps &
  Omit<React.ComponentProps<typeof Link>, "className" | "children">;

/** Link com aparência de botão (navegação: "Nova casa", "Alterar", "Entrar"…). */
export function ButtonLink({
  variant = "primary",
  size = "md",
  icon: IconCmp,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cx(buttonClass(variant, size), className)} {...props}>
      {IconCmp ? <IconCmp aria-hidden /> : null}
      {children}
    </Link>
  );
}
