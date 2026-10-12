import Link from "next/link";
import { BandIcon } from "./icons";
import { cx } from "./styles";

/** Nome do produto em um lugar só. */
export const PRODUCT_NAME = "Agenda da banda";

/** Marca (ícone + nome). Não é título de página — não usa <h1>. */
export function Brand({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center gap-2 font-semibold tracking-tight text-fg",
        size === "lg" ? "text-xl" : "text-base",
      )}
    >
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-on-primary">
        <BandIcon className="size-4" aria-hidden />
      </span>
      {PRODUCT_NAME}
    </Link>
  );
}
