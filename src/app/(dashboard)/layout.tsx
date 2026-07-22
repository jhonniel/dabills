import { isSupabaseConfigured } from "@/lib/env";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listNotifications } from "@/features/notifications/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { items, unreadCount } = await listNotifications();

  return (
    <DashboardShell
      isDemo={!isSupabaseConfigured()}
      notifications={items}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
