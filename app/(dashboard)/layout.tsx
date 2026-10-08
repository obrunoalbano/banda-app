import { DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // getSession é deduplicado por request: a página reaproveita o mesmo resultado.
  const session = await getSession();

  return (
    <DashboardShell userName={session?.user?.name} footer={<LogoutButton />}>
      {children}
    </DashboardShell>
  );
}
