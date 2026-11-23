import Link from "next/link";
import { cx } from "./styles";

/** Nome do produto em um lugar só. */
export const PRODUCT_NAME = "banda app";

/** Marca (logotipo só em texto: "banda app"). Não é título de página — não usa <h1>. */
export function Brand({ href = "/", size = "md" }: { href?: string; size?: "md" | "lg" }) {
  return (
    <Link
      href={href}
      aria-label={`${PRODUCT_NAME} — início`}
      className={cx("inline-flex items-baseline gap-1 lowercase tracking-tight", size === "lg" ? "text-2xl" : "text-lg")}
    >
      <span className="font-bold text-fg">banda</span>
      <span className="font-normal text-fg-muted">app</span>
    </Link>
  );
}
