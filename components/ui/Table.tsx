import { cx } from "./styles";

/*
 * Tabela de listagem responsiva.
 * - ≥ sm: tabela normal.
 * - < sm: cada linha vira um card empilhado; cada célula mostra seu `label` (passe sempre!).
 */

export function Table({
  caption,
  headers,
  children,
}: {
  /** Descrição para leitores de tela (ex.: "Casas de show cadastradas"). */
  caption: string;
  headers: { label: string; align?: "right" }[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="hidden border-b border-line bg-surface-muted sm:table-header-group">
          <tr>
            {headers.map((h) => (
              <th
                key={h.label}
                scope="col"
                className={cx("px-4 py-3 font-medium text-fg-muted", h.align === "right" && "text-right")}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return (
    <tr className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 hover:bg-surface-muted sm:table-row sm:p-0">
      {children}
    </tr>
  );
}

export function Td({
  label,
  children,
  strong,
  align,
  numeric,
}: {
  /** Nome da coluna — exibido como rótulo no layout de card (mobile). */
  label: string;
  children?: React.ReactNode;
  /** Coluna principal (nome): destaque e largura total no mobile. */
  strong?: boolean;
  align?: "right";
  /** Dinheiro, datas, horários: algarismos alinhados. */
  numeric?: boolean;
}) {
  const empty = children === null || children === undefined || children === "";
  return (
    <td
      data-label={label}
      className={cx(
        "sm:px-4 sm:py-3",
        strong ? "col-span-2 font-medium text-fg sm:col-auto" : "text-fg-muted",
        // Rótulo da coluna antes do valor, só no mobile (não no destaque nem nas ações).
        !strong && align !== "right" &&
          "before:block before:text-xs before:font-medium before:text-fg-subtle before:content-[attr(data-label)] sm:before:hidden",
        align === "right" && "col-span-2 sm:col-auto sm:text-right",
        numeric && "tabular",
      )}
    >
      {empty ? "—" : children}
    </td>
  );
}
