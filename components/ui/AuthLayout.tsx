import { Brand } from "./Brand";

/** Moldura das telas públicas de autenticação (login, cadastro). */
export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Link alternativo abaixo do card (ex.: "Já tem conta? Entrar"). */
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Brand />
      </div>
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-fg">{title}</h1>
        {description ? <p className="mt-2 text-sm text-fg-muted">{description}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      {footer ? <div className="mt-6 text-center text-sm text-fg-muted">{footer}</div> : null}
    </div>
  );
}
