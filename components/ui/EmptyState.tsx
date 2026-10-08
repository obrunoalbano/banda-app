import Link from "next/link";
import { linkClass } from "./styles";

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      {message}
      {action ? (
        <>
          {" "}
          <Link href={action.href} className={linkClass}>
            {action.label}
          </Link>
        </>
      ) : null}
    </p>
  );
}
