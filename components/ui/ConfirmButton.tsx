"use client";

import { useId, useRef, useState } from "react";
import { Button } from "./Button";
import type { Icon } from "./icons";
import type { ButtonSize, ButtonVariant } from "./styles";

export type ConfirmButtonProps = {
  /** Texto do botão que abre o modal. */
  label: string;
  /** Variante do botão que abre o modal. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: Icon;
  /** Título do modal (pergunta curta). */
  title: string;
  /** Explica a consequência da ação. */
  description: React.ReactNode;
  /** Texto do botão de confirmação (verbo: "Remover", "Regenerar"…). */
  confirmLabel: string;
  /** `danger` para ações destrutivas/irreversíveis. */
  tone?: "primary" | "danger";
  /**
   * Executa a ação. Retorne uma mensagem de erro para mantê-lo aberto mostrando o erro,
   * ou `null` para fechar.
   */
  onConfirm: () => Promise<string | null>;
  /** Desabilita o botão e explica o motivo (tooltip + leitor de tela). */
  disabledReason?: string;
};

/** Botão + modal de confirmação (<dialog> nativo: foco preso, Esc fecha). */
export function ConfirmButton({
  label,
  variant = "secondary",
  size,
  icon,
  title,
  description,
  confirmLabel,
  tone = "primary",
  onConfirm,
  disabledReason,
}: ConfirmButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const reasonId = useId();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    const message = await onConfirm().catch(() => "Não foi possível concluir. Tente novamente.");
    setLoading(false);
    if (message) {
      setError(message);
      return;
    }
    dialogRef.current?.close();
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        icon={icon}
        onClick={() => {
          setError(null);
          dialogRef.current?.showModal();
        }}
        disabled={!!disabledReason}
        title={disabledReason}
        aria-describedby={disabledReason ? reasonId : undefined}
      >
        {label}
      </Button>
      {disabledReason ? (
        <span id={reasonId} className="sr-only">
          {disabledReason}
        </span>
      ) : null}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-line bg-surface p-6 text-fg shadow-xl backdrop:bg-overlay"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-2 text-sm text-fg-muted">{description}</div>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-danger-fg">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} autoFocus>
            Cancelar
          </Button>
          <Button
            variant={tone === "danger" ? "danger-solid" : "primary"}
            onClick={() => void confirm()}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </dialog>
    </>
  );
}
