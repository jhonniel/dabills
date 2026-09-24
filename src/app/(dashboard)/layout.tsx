import { isSupabaseConfigured } from "@/lib/env";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listNotifications } from "@/features/notifications/queries";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let items: Awaited<ReturnType<typeof listNotifications>>["items"] = [];
  let unreadCount = 0;

  try {
    const notifications = await listNotifications();
    items = notifications.items;
    unreadCount = notifications.unreadCount;
  } catch (error) {
    console.error("DashboardLayout listNotifications", error);
  }

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
