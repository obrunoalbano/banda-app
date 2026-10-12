import { ExploreIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/styles";
import Image from "next/image";

/**
 * Miniatura do palco (WebP 400×300 do nosso storage). Sem imagem → placeholder com ícone.
 * `unoptimized`: o arquivo já é otimizado na migração (não consome a otimização da Vercel).
 */
export function StageThumb({ src, size = "sm" }: { src: string | null; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-48 w-64" : "h-9 w-12";
  if (!src) {
    return (
      <span
        className={cx("flex shrink-0 items-center justify-center rounded border border-line bg-surface-sunken", box)}
        aria-hidden
      >
        <ExploreIcon className={size === "lg" ? "size-8 text-fg-subtle" : "size-4 text-fg-subtle"} strokeWidth={1.5} />
      </span>
    );
  }
  return (
    <Image
      src={src}
      alt=""
      width={size === "lg" ? 256 : 48}
      height={size === "lg" ? 192 : 36}
      unoptimized
      loading="lazy"
      className={cx("shrink-0 rounded border border-line object-cover", box)}
    />
  );
}
