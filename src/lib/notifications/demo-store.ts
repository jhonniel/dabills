import { cookies } from "next/headers";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EmailLog, Notification } from "@/types";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/validators/notification";

const NOTIFICATIONS_COOKIE = "dabills_demo_notifications";
const PREFS_COOKIE = "dabills_demo_notification_prefs";
const EMAIL_LOGS_COOKIE = "dabills_demo_email_logs";
const SENT_REMINDERS_COOKIE = "dabills_demo_sent_reminders";

export async function readDemoNotifications(): Promise<Notification[]> {
  const store = await cookies();
  const raw = store.get(NOTIFICATIONS_COOKIE)?.value;
  if (!raw) return seedNotifications();

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Notification[];
    return Array.isArray(parsed) ? parsed : seedNotifications();
  } catch {
    return seedNotifications();
  }
}

function seedNotifications(): Notification[] {
  const now = Date.now();
  return [
    {
      id: "demo-notif-1",
      user_id: "demo-user",
      type: "reminder_3d",
      title: "Spotify due in 3 days",
      body: "Your Spotify subscription renews soon. Review the upcoming bill.",
      href: "/dashboard/billing",
      is_read: false,
      metadata: { demo: true },
      created_at: new Date(now - 1000 * 60 * 45).toISOString(),
    },
    {
      id: "demo-notif-2",
      user_id: "demo-user",
      type: "payment_received",
      title: "Receipt uploaded",
      body: "A payment receipt is pending verification.",
      href: "/dashboard/payments",
      is_read: false,
      metadata: { demo: true },
      created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "demo-notif-3",
      user_id: "demo-user",
      type: "system",
      title: "Welcome to DaBills notifications",
      body: "You’ll get reminders 5, 3, and 1 day before due dates — plus due today and overdue alerts.",
      href: "/dashboard/settings/notifications",
      is_read: true,
      metadata: { demo: true },
      created_at: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    },
  ];
}

async function writeDemoNotifications(items: Notification[]) {
  const store = await cookies();
  store.set(NOTIFICATIONS_COOKIE, encodeURIComponent(JSON.stringify(items)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function createDemoNotification(
  input: Omit<Notification, "id" | "created_at" | "is_read"> & {
    is_read?: boolean;
  }
) {
  const items = await readDemoNotifications();
  const created: Notification = {
    ...input,
    id: crypto.randomUUID(),
    is_read: input.is_read ?? false,
    created_at: new Date().toISOString(),
  };
  await writeDemoNotifications([created, ...items].slice(0, 100));
  return created;
}

export async function markDemoNotificationRead(id: string) {
  const items = await readDemoNotifications();
  const next = items.map((item) =>
    item.id === id ? { ...item, is_read: true } : item
  );
  await writeDemoNotifications(next);
}

export async function markAllDemoNotificationsRead() {
  const items = await readDemoNotifications();
  await writeDemoNotifications(items.map((item) => ({ ...item, is_read: true })));
}

export async function readDemoNotificationPreferences(): Promise<NotificationPreferences> {
  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
  try {
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(JSON.parse(decodeURIComponent(raw)) as NotificationPreferences),
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export async function writeDemoNotificationPreferences(
  prefs: NotificationPreferences
) {
  const store = await cookies();
  store.set(PREFS_COOKIE, encodeURIComponent(JSON.stringify(prefs)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function readDemoEmailLogs(): Promise<EmailLog[]> {
  const store = await cookies();
  const raw = store.get(EMAIL_LOGS_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as EmailLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendDemoEmailLog(log: Omit<EmailLog, "id" | "created_at">) {
  if (isSupabaseConfigured()) {
    try {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("email_logs")
        .insert({
          user_id: log.user_id,
          to_email: log.to_email,
          subject: log.subject,
          template: log.template,
          status: log.status,
          provider_id: log.provider_id,
          error: log.error,
          metadata: log.metadata,
        })
        .select()
        .single();
      if (!error && data) return data as EmailLog;
      console.error("appendDemoEmailLog", error?.message);
    } catch (error) {
      console.error("appendDemoEmailLog", error);
    }
    return {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
  }

  const items = await readDemoEmailLogs();
  const entry: EmailLog = {
    ...log,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };
  const store = await cookies();
  store.set(
    EMAIL_LOGS_COOKIE,
    encodeURIComponent(JSON.stringify([entry, ...items].slice(0, 50))),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  );
  return entry;
}

export async function readSentReminderIds(): Promise<string[]> {
  const store = await cookies();
  const raw = store.get(SENT_REMINDERS_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function markReminderSent(id: string) {
  const existing = await readSentReminderIds();
  if (existing.includes(id)) return;
  const store = await cookies();
  store.set(
    SENT_REMINDERS_COOKIE,
    encodeURIComponent(JSON.stringify([id, ...existing].slice(0, 500))),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 60,
    }
  );
}
