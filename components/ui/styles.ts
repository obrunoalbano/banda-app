/**
 * Receitas de classes do design system (docs/design-system.md).
 *
 * Só usam tokens semânticos de app/globals.css — nunca paleta crua (zinc-500…) nem `dark:`.
 * Prefira os componentes (Button, Badge, Card…); use estas constantes só onde um componente
 * não cabe (ex.: <Link> estilizado como botão dentro de texto).
 */

/** Junta classes ignorando valores falsy. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/* ── Controles de formulário ─────────────────────────────────────────────── */

export const inputClass =
  "w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-fg shadow-sm placeholder:text-fg-subtle focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-60";

export const inputSmClass = `${inputClass} text-sm`;

export const labelClass = "text-sm font-medium text-fg";

export const hintClass = "text-xs text-fg-subtle";

/* ── Botões ─────────────────────────────────────────────────────────────── */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-solid";
export type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-fg hover:bg-surface-sunken",
  ghost: "text-fg-muted hover:bg-surface-sunken hover:text-fg",
  danger: "border border-danger-line bg-danger-bg text-danger-fg hover:border-danger",
  "danger-solid": "bg-danger text-on-danger hover:bg-danger-hover",
};

/** Alturas: sm 32px (tabelas/toolbars), md 40px (padrão), lg 48px (CTAs da landing). */
const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md"): string {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

/** Botão só com ícone (quadrado). Sempre com `aria-label`. */
export function iconButtonClass(size: ButtonSize = "md"): string {
  const box: Record<ButtonSize, string> = { sm: "size-8", md: "size-10", lg: "size-12" };
  return cx(buttonBase, buttonVariants.ghost, box[size]);
}

/* ── Texto e links ──────────────────────────────────────────────────────── */

/** Link inline em texto corrido / tabelas. */
export const linkClass = "font-medium text-fg underline underline-offset-2 hover:no-underline";

/** Link discreto (ex.: "← Voltar"). */
export const subtleLinkClass = "text-sm text-fg-subtle hover:text-fg";

/* ── Layout ─────────────────────────────────────────────────────────────── */

/** Container padrão de página do dashboard (largura máx. 5xl). */
export const containerClass = "mx-auto w-full max-w-5xl px-4 py-8";

/** Container estreito (formulários longos de leitura, ex.: detalhe de contato). */
export const containerNarrowClass = "mx-auto w-full max-w-3xl px-4 py-8";

/* ── Tons de feedback (Badge, Alert, Callout) ───────────────────────────── */

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const toneClass: Record<Tone, string> = {
  neutral: "bg-neutral-bg text-neutral-fg border-neutral-line",
  info: "bg-info-bg text-info-fg border-info-line",
  success: "bg-success-bg text-success-fg border-success-line",
  warning: "bg-warning-bg text-warning-fg border-warning-line",
  danger: "bg-danger-bg text-danger-fg border-danger-line",
};
