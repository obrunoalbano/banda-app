/** Tabela padrão das listagens (rola na horizontal em telas estreitas). */
export function Table({
  headers,
  minWidth = 720,
  children,
}: {
  headers: { label: string; align?: "right" }[];
  minWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-sm" style={{ minWidth }}>
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <tr>
            {headers.map((h) => (
              <th
                key={h.label}
                scope="col"
                className={`px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300 ${h.align === "right" ? "text-right" : ""}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="bg-white dark:bg-zinc-950">{children}</tr>;
}

export function Td({
  children,
  strong,
  align,
}: {
  children?: React.ReactNode;
  /** Primeira coluna (nome) em destaque. */
  strong?: boolean;
  align?: "right";
}) {
  const tone = strong
    ? "font-medium text-zinc-900 dark:text-zinc-100"
    : "text-zinc-700 dark:text-zinc-300";
  return (
    <td className={`px-4 py-3 ${tone} ${align === "right" ? "text-right" : ""}`}>
      {children === null || children === undefined || children === "" ? "—" : children}
    </td>
  );
}
