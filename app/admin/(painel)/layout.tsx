import { DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";
import { getSession, requireAdminId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s · Painel · Agenda da banda", default: "Painel · Agenda da banda" },
  robots: { index: false, follow: false },
};

/** Painel superadmin (/admin). Acesso controlado em lib/access.ts + requireAdminId. */
export default async function AdminPainelLayout({ children }: { children: React.ReactNode }) {
  await requireAdminId();
  const session = await getSession();
  return (
    <DashboardShell variant="admin" userName={session?.user?.name} footer={<LogoutButton redirectTo="/admin/login" />}>
      {children}
    </DashboardShell>
  );
}
