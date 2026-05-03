import { auth } from "@/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <DashboardShell userName={session?.user?.name} footer={<LogoutButton />}>
      {children}
    </DashboardShell>
  );
}
