import Image from "next/image";
import { SongIcon } from "@/components/ui/icons";
import { cx } from "@/components/ui/styles";

/** Capa da música (CDN do Spotify) ou ícone. `unoptimized`: a imagem já vem pequena do Spotify. */
export function SongCover({ src, className }: { src: string | null; className?: string }) {
  const box = cx("size-10 shrink-0 rounded", className);
  if (!src) {
    return (
      <span className={cx(box, "flex items-center justify-center border border-line bg-surface-sunken")} aria-hidden>
        <SongIcon className="size-4 text-fg-subtle" />
      </span>
    );
  }
  return (
    <Image src={src} alt="" width={40} height={40} unoptimized loading="lazy" className={cx(box, "object-cover")} />
  );
}
