import { DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";
import { BAND_ROLE_SHORT } from "@/lib/band-roles";
import { getBandContext, getSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Deduplicados por request: a página reaproveita o mesmo resultado.
  const [session, ctx] = await Promise.all([getSession(), getBandContext()]);
  const band =
    "reason" in ctx
      ? null
      : {
          name: ctx.bandName,
          roleLabel: BAND_ROLE_SHORT[ctx.role],
          canEdit: ctx.canEdit,
        };

  return (
    <DashboardShell userName={session?.user?.name} band={band} footer={<LogoutButton />}>
      {children}
    </DashboardShell>
  );
}
