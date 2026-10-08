/**
 * Classes Tailwind compartilhadas (fonte única do visual).
 * Paleta zinc + variantes dark:. Ao mudar o visual, mude aqui.
 */

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100";

export const inputSmClass = `${inputClass} text-sm`;

export const labelClass = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

const buttonBase =
  "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

export const buttonPrimaryClass = `${buttonBase} bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`;

export const buttonSecondaryClass = `${buttonBase} border border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800`;

export const buttonDangerClass = `${buttonBase} border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60`;

export const buttonDangerSolidClass = `${buttonBase} bg-red-600 text-white hover:bg-red-700`;

export const linkClass =
  "font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-100";

export const containerClass = "mx-auto w-full max-w-5xl px-4 py-8";
