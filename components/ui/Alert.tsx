import { DangerIcon, InfoIcon, SuccessIcon, WarningIcon, type Icon } from "./icons";
import { cx, toneClass } from "./styles";

type AlertTone = "danger" | "success" | "warning" | "info";

const icons: Record<AlertTone, Icon> = {
  danger: DangerIcon,
  success: SuccessIcon,
  warning: WarningIcon,
  info: InfoIcon,
};

/**
 * Mensagem de feedback em bloco (erro de formulário, sucesso ao salvar, aviso).
 * `danger` é anunciado imediatamente a leitores de tela (role="alert").
 */
export function Alert({
  tone = "danger",
  title,
  children,
  className,
}: {
  tone?: AlertTone;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const IconCmp = icons[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("flex gap-3 rounded-md border px-3 py-2.5 text-sm", toneClass[tone], className)}
    >
      <IconCmp className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className={title ? "mt-0.5" : undefined}>{children}</div>
      </div>
    </div>
  );
}
