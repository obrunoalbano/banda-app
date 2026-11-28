"use client";

import {
  PDF_PAGE_PX,
  renderRepertoireImage,
  renderRepertoirePdfPage,
  type ImageTheme,
} from "@/components/repertoire/repertoire-image";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/ui/fields";
import {
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  ImageIcon,
  PdfIcon,
  ShareIcon,
  TextIcon,
  WhatsappIcon,
} from "@/components/ui/icons";
import { Sheet } from "@/components/ui/Sheet";
import { buttonClass } from "@/components/ui/styles";
import {
  DEFAULT_SHARE_OPTIONS,
  repertoireFileName,
  repertoireShareText,
  type ShareOptions,
  type ShareSong,
} from "@/lib/repertoire";
import { jpegPagesToPdf } from "@/lib/pdf";
import { useEffect, useRef, useState } from "react";

type Format = "text" | "image" | "pdf";
type PdfFile = { blob: Blob; url: string; previewUrl: string; compact: boolean; key: string };
type Feedback = { tone: "success" | "danger"; text: string } | null;

/**
 * "Compartilhar" do repertório: listagem em texto (formatação do WhatsApp), imagem PNG ou PDF
 * (páginas A4 para imprimir/enviar). Copiar, baixar, abrir no WhatsApp (wa.me) ou o compartilhar
 * do celular (Web Share API, que manda o arquivo direto para o WhatsApp). Tudo no navegador —
 * nada é publicado nem gravado.
 */
export function ShareRepertoireButton({
  bandName,
  name,
  description,
  songs,
  logoUrl = null,
}: {
  bandName: string;
  name: string;
  description: string | null;
  songs: ShareSong[];
  /** Logo da banda (/banda/logo?v=…), no canto superior direito da imagem e do PDF. */
  logoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("text");
  const [options, setOptions] = useState<ShareOptions>(DEFAULT_SHARE_OPTIONS);
  const [theme, setTheme] = useState<ImageTheme>("light");
  const [image, setImage] = useState<{ blob: Blob; url: string; key: string } | null>(null);
  const [pdf, setPdf] = useState<PdfFile | null>(null);
  const [logo, setLogo] = useState<{ url: string; img: HTMLImageElement | null } | null>(null);
  // Logo carregada (ou falhou: segue sem logo) para a URL atual?
  const logoReady = !logoUrl || logo?.url === logoUrl;
  const logoImg = logoUrl && logo?.url === logoUrl ? logo.img : null;
  const [feedback, setFeedback] = useState<Feedback>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [canShare, setCanShare] = useState({ text: false, files: false, pdfFiles: false, copyImage: false });

  const text = repertoireShareText({ bandName, name, description, songs, options });
  const fileName = repertoireFileName(name, "png");
  const pdfName = repertoireFileName(name, "pdf");

  // A imagem atual corresponde às opções escolhidas? (senão está sendo gerada de novo)
  const imageKey = `${theme}|${options.artists}|${options.notes}|${options.durations}|${logoImg ? logoUrl : ""}`;
  const rendering = format === "image" && image?.key !== imageKey;
  // PDF: sempre fundo claro (impressão), então o tema não entra na chave.
  const pdfKey = `${options.artists}|${options.notes}|${options.durations}|${logoImg ? logoUrl : ""}`;
  const pdfRendering = format === "pdf" && pdf?.key !== pdfKey;

  // Carrega a logo uma vez (mesma origem: o canvas não fica "contaminado" e pode exportar).
  useEffect(() => {
    if (!open || !logoUrl || logo?.url === logoUrl) return;
    const img = new Image();
    img.onload = () => setLogo({ url: logoUrl, img });
    img.onerror = () => setLogo({ url: logoUrl, img: null });
    img.src = logoUrl;
  }, [open, logoUrl, logo]);

  // Gera a imagem ao abrir a aba "Imagem" e sempre que as opções mudam.
  useEffect(() => {
    if (!open || format !== "image" || !logoReady) return;
    let cancelled = false;
    renderRepertoireImage({
      bandName,
      name,
      description,
      songs,
      options,
      theme,
      logo: logoImg,
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
  }, [open, format, options, theme, imageKey, logoReady, logoImg, bandName, name, description, songs]);

  // Gera o PDF (páginas A4 em canvas → JPEG → PDF) ao abrir a aba "PDF" e quando as opções mudam.
  useEffect(() => {
    if (!open || format !== "pdf" || !logoReady) return;
    let cancelled = false;
    renderRepertoirePdfPage({
      bandName,
      name,
      description,
      songs,
      options,
      logo: logoImg,
      fontFamily: getComputedStyle(document.body).fontFamily || "system-ui, sans-serif",
    })
      .then((page) => {
        if (cancelled) return;
        const bytes = jpegPagesToPdf([{ jpeg: page.jpeg, ...PDF_PAGE_PX }]);
        const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
        const next: PdfFile = {
          blob,
          url: URL.createObjectURL(blob),
          previewUrl: URL.createObjectURL(new Blob([page.jpeg as BlobPart], { type: "image/jpeg" })),
          compact: page.compact,
          key: pdfKey,
        };
        setPdf((previous) => {
          if (previous) {
            URL.revokeObjectURL(previous.url);
            URL.revokeObjectURL(previous.previewUrl);
          }
          return next;
        });
      })
      .catch(() => !cancelled && setFeedback({ tone: "danger", text: "Não foi possível gerar o PDF." }));
    return () => {
      cancelled = true;
    };
  }, [open, format, options, pdfKey, logoReady, logoImg, bandName, name, description, songs]);

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

  async function sharePdf() {
    if (!pdf) return;
    try {
      await navigator.share({ files: [new File([pdf.blob], pdfName, { type: "application/pdf" })], title: name });
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
          const pdfProbe = new File([new Blob()], "x.pdf", { type: "application/pdf" });
          const canShareFiles = (file: File) =>
            typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
          setCanShare({
            text: typeof navigator.share === "function",
            files: canShareFiles(probe),
            pdfFiles: canShareFiles(pdfProbe),
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
        description="Gere a listagem em texto, imagem ou PDF para mandar no WhatsApp ou imprimir."
      >
        <div className="flex gap-2" role="group" aria-label="Formato">
          {(
            [
              ["text", "Texto", TextIcon],
              ["image", "Imagem", ImageIcon],
              ["pdf", "PDF", PdfIcon],
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
        ) : format === "pdf" ? (
          <div className="flex flex-col gap-3">
            <div
              className="flex min-h-40 items-start justify-center overflow-hidden rounded-lg border border-line bg-surface-muted"
              aria-busy={pdfRendering}
              style={{ opacity: pdfRendering && pdf ? 0.6 : 1 }}
            >
              {pdf ? (
                // eslint-disable-next-line @next/next/no-img-element -- blob gerado no navegador
                <img
                  src={pdf.previewUrl}
                  alt={`Primeira página do PDF do repertório ${name}`}
                  className="h-auto w-full"
                />
              ) : (
                <p className="self-center p-6 text-sm text-fg-muted">Gerando o PDF…</p>
              )}
            </div>
            {pdf ? (
              pdf.compact ? (
                <Alert tone="warning">
                  O repertório é grande: para caber numa página, artistas e observações ficaram de fora do PDF.
                </Alert>
              ) : (
                <p className="text-sm text-fg-muted" aria-live="polite">
                  Uma página A4, com a lista em duas colunas.
                </p>
              )
            ) : null}
            <div className="flex flex-wrap gap-2">
              {canShare.pdfFiles ? (
                <Button icon={ShareIcon} disabled={!pdf} onClick={() => void sharePdf()}>
                  Compartilhar PDF
                </Button>
              ) : null}
              {pdf ? (
                <>
                  <a
                    href={pdf.url}
                    download={pdfName}
                    onClick={() => done("PDF baixado. Envie pelo WhatsApp como documento.")}
                    className={buttonClass(canShare.pdfFiles ? "secondary" : "primary")}
                  >
                    <DownloadIcon className="size-4" aria-hidden />
                    Baixar PDF
                  </a>
                  <a href={pdf.url} target="_blank" rel="noreferrer" className={buttonClass("secondary")}>
                    <ExternalLinkIcon className="size-4" aria-hidden />
                    Abrir para imprimir
                  </a>
                </>
              ) : null}
            </div>
            <p className="text-xs text-fg-subtle">
              Sempre com fundo branco, para imprimir. No celular, &quot;Compartilhar PDF&quot; abre a lista de apps —
              escolha o WhatsApp.
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
