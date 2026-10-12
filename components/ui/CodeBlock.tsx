"use client";

import { useState } from "react";
import { Button } from "./Button";
import { CheckIcon, CopyIcon } from "./icons";
import { cx } from "./styles";

/** Bloco de código/valor técnico (URL, token, exemplo) com botão de copiar opcional. */
export function CodeBlock({
  label,
  children,
  copyable,
  wrap,
}: {
  label?: string;
  /** Conteúdo em texto puro. */
  children: string;
  copyable?: boolean;
  /** Quebra linhas longas (exemplos de código) em vez de rolar. */
  wrap?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de clipboard: o texto continua visível para copiar manualmente.
    }
  }

  return (
    <div>
      {label || copyable ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          {label ? <span className="text-xs font-medium text-fg-subtle">{label}</span> : <span />}
          {copyable ? (
            <Button variant="ghost" size="sm" icon={copied ? CheckIcon : CopyIcon} onClick={() => void copy()}>
              {copied ? "Copiado" : "Copiar"}
            </Button>
          ) : null}
        </div>
      ) : null}
      <pre
        className={cx(
          "overflow-x-auto rounded-md border border-line bg-surface-sunken px-3 py-2 font-mono text-xs text-fg",
          wrap && "whitespace-pre-wrap break-all",
        )}
      >
        {children}
      </pre>
    </div>
  );
}
