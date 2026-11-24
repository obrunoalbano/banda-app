"use client";

import { renderRepertoireImage, type ImageTheme } from "@/components/repertoire/repertoire-image";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/fields";
import { CopyIcon, DownloadIcon, ImageIcon, ShareIcon, TextIcon, WhatsappIcon } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { buttonClass } from "@/components/ui/styles";
import {
  DEFAULT_SHARE_OPTIONS,
  repertoireFileName,
  repertoireShareText,
  type ShareOptions,
  type ShareSong,
} from "@/lib/repertoire";
import { useEffect, useRef, useState } from "react";

type Format = "text" | "image";
type Feedback = { tone: "success" | "danger"; text: string } | null;

/**
 * "Compartilhar" do repertório: listagem em texto (formatação do WhatsApp) ou imagem PNG.
 * Copiar, abrir no WhatsApp (wa.me) ou o compartilhar do celular (Web Share API, que manda
 * a imagem direto para o WhatsApp). Tudo no navegador — nada é publicado nem gravado.
 */
export function ShareRepertoireButton({
  bandName,
  name,
  description,
  songs,
}: {
  bandName: string;
  name: string;
  description: string | null;
  songs: ShareSong[];
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("text");
  const [options, setOptions] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);
  const [theme, setTheme] = useState<ImageTheme>("light");
  const [image, setImage] = useState<{ blob: Blob; url: string; key: string } | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [canShare, setCanShare] = useState({ text: false, files: false, copyImage: false });

  const text = repertoireShareText({ bandName, name, description, songs, options });
  const fileName = repertoireFileName(name, "png");

  // A imagem atual corresponde às opções escolhidas? (senão está sendo gerada de novo)
  const imageKey = `${theme}|${options.artists}|${options.notes}|${options.durations}`;
  const rendering = format === "image" && image?.key !== imageKey;

  // Gera a imagem ao abrir a aba "Imagem" e sempre que as opções mudam.
  useEffect(() => {
    if (!open || format !== "image") return;
    let cancelled = false;
    renderRepertoireImage({
      bandName,
      name,
      description,
      songs,
      options,
      theme,
      fontFamily: getComputedStyle(document.body).fontFamily || "system-ui, sans-serif",
    })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        // A anterior continua na tela até a nova ficar pronta; só então libera o endereço dela.
        setImage((previous) => {
          if (previous) URL.revokeObjectURL(previous.url);
          return { blob, url, key: imageKey };
        });
      })
      .catch(() => !cancelled && setFeedback({ tone: "danger", text: "Não foi possível gerar a imagem." }));
    return () => {
      cancelled = true;
    };
  }, [open, format, options, theme, imageKey, bandName, name, description, songs]);

  const done = (message: string) => setFeedback({ tone: "success", text: message });
  const fail = (message: string) => setFeedback({ tone: "danger", text: message });

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      return done("Texto copiado. Cole na conversa do WhatsApp.");
    } catch {
      // Sem permissão de clipboard (navegador embutido, http): seleciona o campo e copia do jeito antigo.
      const field = textRef.current;
      field?.focus();
      field?.select();
      if (field && document.execCommand?.("copy")) return done("Texto copiado. Cole na conversa do WhatsApp.");
      fail("Não foi possível copiar. O texto está selecionado: copie manualmente.");
    }
  }

  async function shareText() {
    try {
      await navigator.share({ text });
    } catch (e) {
      if ((e as Error).name !== "AbortError") fail("Não foi possível abrir o compartilhamento.");
    }
  }

  async function copyImage() {
    if (!image) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": image.blob })]);
      done("Imagem copiada. Cole na conversa do WhatsApp.");
    } catch {
      fail("Este navegador não deixou copiar a imagem. Use Baixar imagem.");
    }
  }

  async function shareImage() {
    if (!image) return;
    try {
      await navigator.share({ files: [new File([image.blob], fileName, { type: "image/png" })], title: name });
    } catch (e) {
      if ((e as Error).name !== "AbortError") fail("Não foi possível abrir o compartilhamento.");
    }
  }

  const toggle = (key: keyof ShareOptions) => setOptions((o) => ({ ...o, [key]: !o[key] }));

  return (
    <>
      <Button
        variant="secondary"
        icon={ShareIcon}
        onClick={() => {
          const probe = new File([new Blob()], "x.png", { type: "image/png" });
          setCanShare({
            text: typeof navigator.share === "function",
            files: typeof navigator.canShare === "function" && navigator.canShare({ files: [probe] }),
            copyImage: typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function",
          });
          setFeedback(null);
          setOpen(true);
        }}
      >
        Compartilhar
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Compartilhar repertório"
        description="Gere a listagem em texto ou imagem para mandar no WhatsApp."
      >
        <div className="flex gap-2" role="group" aria-label="Formato">
          {(
            [
              ["text", "Texto", TextIcon],
              ["image", "Imagem", ImageIcon],
            ] as const
          ).map(([value, label, icon]) => (
            <Button
              key={value}
              variant={format === value ? "primary" : "secondary"}
              icon={icon}
              aria-pressed={format === value}
              className="flex-1"
              onClick={() => {
                setFeedback(null);
                setFormat(value);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium text-fg">Mostrar</legend>
          <CheckboxField label="Artistas" checked={options.artists} onChange={() => toggle("artists")} />
          <CheckboxField label="Observações" checked={options.notes} onChange={() => toggle("notes")} />
          <CheckboxField
            label="Duração de cada música"
            checked={options.durations}
            onChange={() => toggle("durations")}
          />
          {format === "image" ? (
            <CheckboxField
              label="Fundo escuro"
              checked={theme === "dark"}
              onChange={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            />
          ) : null}
        </fieldset>

        {feedback ? <Alert tone={feedback.tone}>{feedback.text}</Alert> : null}

        {format === "text" ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-fg">Texto</span>
              <textarea
                ref={textRef}
                readOnly
                value={text}
                rows={12}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full resize-y rounded-lg border border-line bg-surface-muted p-3 font-mono text-sm text-fg sm:text-xs"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button icon={CopyIcon} onClick={() => void copyText()}>
                Copiar texto
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noreferrer"
                className={buttonClass("secondary")}
              >
                <WhatsappIcon className="size-4" aria-hidden />
                Abrir no WhatsApp
              </a>
              {canShare.text ? (
                <Button variant="secondary" icon={ShareIcon} onClick={() => void shareText()}>
                  Mais opções
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-fg-subtle">
              No WhatsApp, o texto entre *asteriscos* aparece em negrito e entre _sublinhados_ em itálico.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div
              className="flex min-h-40 items-start justify-center overflow-hidden rounded-lg border border-line bg-surface-muted"
              aria-busy={rendering}
              style={{ opacity: rendering && image ? 0.6 : 1 }}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob gerado no navegador
                <img src={image.url} alt={`Imagem do repertório ${name}`} className="h-auto w-full" />
              ) : (
                <p className="self-center p-6 text-sm text-fg-muted">Gerando a imagem…</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {canShare.files ? (
                <Button icon={ShareIcon} disabled={!image} onClick={() => void shareImage()}>
                  Compartilhar imagem
                </Button>
              ) : null}
              {canShare.copyImage ? (
                <Button
                  variant={canShare.files ? "secondary" : "primary"}
                  icon={CopyIcon}
                  disabled={!image}
                  onClick={() => void copyImage()}
                >
                  Copiar imagem
                </Button>
              ) : null}
              {image ? (
                <a
                  href={image.url}
                  download={fileName}
                  onClick={() => done("Imagem baixada. Envie pelo WhatsApp como foto.")}
                  className={buttonClass("secondary")}
                >
                  <DownloadIcon className="size-4" aria-hidden />
                  Baixar imagem
                </a>
              ) : null}
            </div>
            <p className="text-xs text-fg-subtle">
              No celular, &quot;Compartilhar imagem&quot; abre a lista de apps — escolha o WhatsApp.
            </p>
          </div>
        )}
      </Sheet>
    </>
  );
}
