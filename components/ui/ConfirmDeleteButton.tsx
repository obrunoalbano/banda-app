"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { buttonDangerClass, buttonDangerSolidClass, buttonSecondaryClass } from "./styles";

type ConfirmDeleteButtonProps = {
  /** Endpoint que recebe o DELETE (ex.: `/api/shows/123`). */
  endpoint: string;
  /** Para onde ir após remover. */
  redirectTo: string;
  /** Ex.: `o show "Bar X - 15/12/2026"`. */
  itemLabel: string;
  /** Quando definido, o botão fica desabilitado e o motivo aparece como dica. */
  disabledReason?: string;
};

/** Botão "Remover" com modal de confirmação (<dialog> nativo: foco preso, Esc fecha). */
export function ConfirmDeleteButton({
  endpoint,
  redirectTo,
  itemLabel,
  disabledReason,
}: ConfirmDeleteButtonProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    dialogRef.current?.showModal();
  }

  async function confirm() {
    setLoading(true);
    setError(null);
    const res = await fetch(endpoint, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      setError(typeof data.error === "string" ? data.error : "Não foi possível remover.");
      setLoading(false);
      return;
    }
    dialogRef.current?.close();
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={!!disabledReason}
        title={disabledReason}
        className={buttonDangerClass}
      >
        Remover
      </button>
      {disabledReason ? <span className="sr-only">{disabledReason}</span> : null}

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-delete-title"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      >
        <h2 id="confirm-delete-title" className="text-lg font-semibold">
          Remover?
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Remover {itemLabel}? Esta ação não pode ser desfeita.
        </p>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={buttonSecondaryClass}
            autoFocus
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={loading}
            className={buttonDangerSolidClass}
          >
            {loading ? "Removendo…" : "Remover"}
          </button>
        </div>
      </dialog>
    </>
  );
}
