import { DashboardShell } from "@/components/DashboardShell";
import { LogoutButton } from "@/components/LogoutButton";
import { BAND_ROLE_SHORT } from "@/lib/band-roles";
import { pendingRehearsalCount } from "@/lib/rehearsal-query";
import { todayDateOnly } from "@/lib/shows";
import { getBandContext, getSession } from "@/lib/session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Deduplicados por request: a página reaproveita o mesmo resultado.
  const [session, ctx] = await Promise.all([getSession(), getBandContext()]);
  // Ensaios sem resposta do usuário (selo no menu). Falha aqui não pode derrubar o app inteiro.
  const pendingRehearsals =
    "reason" in ctx ? 0 : await pendingRehearsalCount(ctx.bandId, ctx.userId, todayDateOnly()).catch(() => 0);
  const band =
    "reason" in ctx
      ? null
      : {
          name: ctx.bandName,
          roleLabel: BAND_ROLE_SHORT[ctx.role],
          canEdit: ctx.canEdit,
          badges: pendingRehearsals ? { "/ensaios": pendingRehearsals } : undefined,
        };

  return (
    <DashboardShell userName={session?.user?.name} band={band} footer={<LogoutButton />}>
      {children}
    </DashboardShell>
  );
}
