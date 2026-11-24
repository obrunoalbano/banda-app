"use client";

import { Button } from "@/components/ui/Button";
import { AddToHomeIcon, InstallIcon, MoreIcon, ShareIcon } from "@/components/ui/icons";
import { PRODUCT_NAME } from "@/components/ui/Brand";
import { cx } from "@/components/ui/styles";
import { useEffect, useId, useRef, useState } from "react";

/** Evento do Chrome/Edge/Android para instalar o PWA (não está nos tipos do DOM). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Mode = "hidden" | "prompt" | "ios" | "manual";

/** Já está rodando como app instalado (tela cheia)? */
function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS se apresenta como Mac: diferencia pelo toque.
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
}

/**
 * "Instalar app" (PWA). Android/Chrome: abre o diálogo nativo de instalação. iPhone/iPad (Safari
 * não tem esse diálogo): mostra o passo a passo "Compartilhar → Adicionar à Tela de Início".
 * Outros navegadores mobile sem o evento: passo a passo pelo menu do navegador.
 * Some quando o app já está instalado (aberto em tela cheia) ou no desktop sem suporte.
 */
export function InstallAppButton({ variant = "button" }: { variant?: "button" | "menu" }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (isStandalone()) return;
    // Estado inicial derivado do navegador (só existe no cliente): sem setState síncrono no effect.
    const initial = window.setTimeout(() => setMode(isIos() ? "ios" : isMobile() ? "manual" : "hidden"), 0);
    const onPrompt = (e: Event) => {
      e.preventDefault(); // guarda o evento para abrir quando a pessoa clicar
      deferred.current = e as BeforeInstallPromptEvent;
      setMode("prompt");
    };
    const onInstalled = () => {
      deferred.current = null;
      setMode("hidden");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(initial);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "hidden") return null;

  async function install() {
    const event = deferred.current;
    if (!event) {
      dialogRef.current?.showModal();
      return;
    }
    await event.prompt();
    const { outcome } = await event.userChoice;
    deferred.current = null;
    if (outcome === "accepted") setMode("hidden");
  }

  const trigger =
    variant === "menu" ? (
      <button
        type="button"
        onClick={() => void install()}
        className="flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm font-medium text-fg hover:bg-surface-sunken"
      >
        <InstallIcon className="size-5 shrink-0 text-fg-subtle" aria-hidden />
        Instalar o app no celular
      </button>
    ) : (
      <Button variant="secondary" icon={InstallIcon} onClick={() => void install()}>
        Instalar app
      </Button>
    );

  return (
    <>
      {trigger}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-line bg-surface p-6 text-left text-fg shadow-xl backdrop:bg-overlay"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Instalar o {PRODUCT_NAME}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          O app fica na tela de início e abre em tela cheia, como um aplicativo.
        </p>
        <ol className="mt-4 flex flex-col gap-3 text-sm">
          {mode === "ios" ? (
            <>
              <Step n={1} icon={ShareIcon}>
                No Safari, toque em <strong>Compartilhar</strong> (na barra de baixo ou de cima).
              </Step>
              <Step n={2} icon={AddToHomeIcon}>
                Role e toque em <strong>Adicionar à Tela de Início</strong>.
              </Step>
              <Step n={3}>
                Toque em <strong>Adicionar</strong>. Pronto: abra pelo ícone do {PRODUCT_NAME}.
              </Step>
            </>
          ) : (
            <>
              <Step n={1} icon={MoreIcon}>
                Abra o <strong>menu do navegador</strong> (⋮ ou ☰).
              </Step>
              <Step n={2} icon={AddToHomeIcon}>
                Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
              </Step>
              <Step n={3}>Confirme. Pronto: abra pelo ícone do {PRODUCT_NAME}.</Step>
            </>
          )}
        </ol>
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} autoFocus>
            Entendi
          </Button>
        </div>
      </dialog>
    </>
  );
}

function Step({ n, icon: StepIcon, children }: { n: number; icon?: typeof ShareIcon; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cx(
          "flex size-6 shrink-0 items-center justify-center rounded-full border border-line text-xs font-semibold text-fg-muted",
        )}
        aria-hidden
      >
        {n}
      </span>
      <span className="flex-1 pt-0.5">
        {children}
        {StepIcon ? <StepIcon className="ml-1 inline size-4 align-text-bottom text-fg-subtle" aria-hidden /> : null}
      </span>
    </li>
  );
}
