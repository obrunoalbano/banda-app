const styles = {
  error: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  success: "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
  warning: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
} as const;

export function Alert({
  tone = "error",
  children,
}: {
  tone?: keyof typeof styles;
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-md px-3 py-2 text-sm ${styles[tone]}`}
    >
      {children}
    </p>
  );
}
