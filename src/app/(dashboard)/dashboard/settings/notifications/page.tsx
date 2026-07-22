import { NotificationInbox, EmailLogsCard } from "@/components/notifications/notification-inbox";
import { NotificationPreferencesForm } from "@/components/notifications/preferences-form";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getNotificationPreferences,
  listEmailLogs,
  listNotifications,
} from "@/features/notifications/queries";

export default async function NotificationSettingsPage() {
  const [{ items, unreadCount }, { preferences }, logs] = await Promise.all([
    listNotifications(),
    getNotificationPreferences(),
    listEmailLogs(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Notifications
        </h1>
        <p className="mt-2 text-muted-foreground">
          Reminder emails, in-app alerts, and delivery preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Unread" value={String(unreadCount)} />
        <StatCard title="Inbox" value={String(items.length)} />
        <StatCard title="Emails logged" value={String(logs.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <NotificationPreferencesForm initial={preferences} />
        </div>
        <div className="space-y-6 xl:col-span-2">
          <NotificationInbox items={items} />
          <EmailLogsCard logs={logs} />
        </div>
      </div>
    </div>
  );
}
