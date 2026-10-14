import { cx } from "./styles";

type CardProps = {
  /** Título da seção (vira <h2>). */
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Ações à direita do título. */
  actions?: React.ReactNode;
  /** `muted` = fundo levemente acinzentado (barras de filtro, áreas secundárias). */
  muted?: boolean;
  className?: string;
  children: React.ReactNode;
};

/** Contêiner de seção: borda + raio lg + padding. Agrupa conteúdo relacionado. */
export function Card({ title, description, actions, muted, className, children }: CardProps) {
  return (
    <section
      className={cx(
        "rounded-lg border border-line p-4 sm:p-5",
        muted ? "bg-surface-muted" : "bg-surface",
        className,
      )}
    >
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h2 className="text-base font-semibold text-fg">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-fg-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
