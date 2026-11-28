"use client";

import { Alert } from "@/components/ui/Alert";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { DeleteIcon, ImageIcon, UploadIcon } from "@/components/ui/icons";
import { buttonClass, cx } from "@/components/ui/styles";
import { fitWithin, LOGO_ACCEPT_LABEL, LOGO_LIMITS } from "@/lib/band-logo";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

/** Reduz a imagem escolhida (até `maxSide`) num canvas e devolve PNG (mantém transparência). */
async function toPng(file: File, maxSide: number): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    // SVG sem width/height informa 0: usa um tamanho padrão.
    const w = img.naturalWidth || maxSide;
    const h = img.naturalHeight || maxSide;
    const size = fitWithin(w, h, maxSide, maxSide);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, size.width, size.height);
    return await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("png"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Logo da banda (Minha banda). A imagem é reduzida no navegador e enviada em PNG; aparece no
 * canto superior direito dos arquivos do "Compartilhar" (imagem e PDF). Só administrador altera.
 */
export function BandLogoField({ logoUrl, canEdit }: { logoUrl: string | null; canEdit: boolean }) {
  const router = useRouter();
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  async function upload(file: File) {
    setMessage(null);
    if (!(LOGO_LIMITS.acceptedTypes as readonly string[]).includes(file.type)) {
      return setMessage({ tone: "danger", text: `Formato não aceito. Use ${LOGO_ACCEPT_LABEL}.` });
    }
    if (file.size > LOGO_LIMITS.maxUploadBytes) {
      return setMessage({ tone: "danger", text: "Arquivo maior que 2 MB. Escolha uma imagem menor." });
    }
    setUploading(true);
    try {
      // Fotos muito detalhadas podem passar de 1 MB em PNG: tenta tamanhos menores.
      let png: Blob | null = null;
      for (const side of [LOGO_LIMITS.maxSide, 600, 400]) {
        const candidate = await toPng(file, side);
        if (candidate.size <= LOGO_LIMITS.maxStoredBytes) {
          png = candidate;
          break;
        }
      }
      if (!png) return setMessage({ tone: "danger", text: "Não foi possível reduzir a imagem. Tente outro arquivo." });
      const res = await fetch("/api/band/logo", {
        method: "POST",
        headers: { "Content-Type": "image/png" },
        body: png,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return setMessage({
          tone: "danger",
          text: typeof data.error === "string" ? data.error : "Não foi possível enviar.",
        });
      }
      setMessage({ tone: "success", text: "Logo salva. Ela aparece nos arquivos do Compartilhar." });
      router.refresh();
    } catch {
      setMessage({ tone: "danger", text: "Não foi possível ler a imagem. Tente outro arquivo." });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Fundo branco de propósito (nos dois temas): é como a logo sai nos arquivos (papel branco). */}
        <div
          className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line p-2"
          style={{ backgroundColor: "#ffffff", color: "#71717a" }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- imagem da própria banda, servida por /banda/logo
            <img src={logoUrl} alt="Logo da banda" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImageIcon className="size-5" aria-hidden />
              Sem logo
            </span>
          )}
        </div>
        {canEdit ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor={inputId}
                className={cx(
                  buttonClass("secondary"),
                  "cursor-pointer",
                  uploading && "pointer-events-none opacity-60",
                )}
                aria-disabled={uploading}
              >
                <UploadIcon className="size-4" aria-hidden />
                {uploading ? "Enviando…" : logoUrl ? "Trocar logo" : "Enviar logo"}
              </label>
              <input
                id={inputId}
                type="file"
                accept={LOGO_LIMITS.acceptedTypes.join(",")}
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) void upload(file);
                }}
              />
              {logoUrl ? (
                <ConfirmButton
                  label="Remover logo"
                  icon={DeleteIcon}
                  variant="ghost"
                  title="Remover a logo?"
                  description="Os arquivos do Compartilhar voltam a sair sem logo. Você pode enviar outra quando quiser."
                  confirmLabel="Remover"
                  tone="danger"
                  onConfirm={async () => {
                    const res = await fetch("/api/band/logo", { method: "DELETE" });
                    if (!res.ok) return "Não foi possível remover. Tente de novo.";
                    setMessage(null);
                    router.refresh();
                    return null;
                  }}
                />
              ) : null}
            </div>
            <p className="text-xs text-fg-subtle">{LOGO_ACCEPT_LABEL}. Fundo transparente fica melhor.</p>
          </div>
        ) : null}
      </div>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}
    </div>
  );
}
