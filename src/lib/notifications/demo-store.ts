import { cookies } from "next/headers";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient, tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { EmailLog, Notification } from "@/types";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/validators/notification";

const NOTIFICATIONS_COOKIE = "dabills_demo_notifications";
const PREFS_COOKIE = "dabills_demo_notification_prefs";
const EMAIL_LOGS_COOKIE = "dabills_demo_email_logs";
const SENT_REMINDERS_COOKIE = "dabills_demo_sent_reminders";

function mergePreferences(
  raw: Partial<NotificationPreferences> | null | undefined
): NotificationPreferences {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(raw ?? {}),
  };
}

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
  if (isSupabaseConfigured() && input.user_id !== "demo-user") {
    try {
      const admin = tryCreateAdminClient();
      if (admin) {
        const { data, error } = await admin
          .from("notifications")
          .insert({
            user_id: input.user_id,
            type: input.type,
            title: input.title,
            body: input.body,
            href: input.href ?? null,
            is_read: input.is_read ?? false,
            metadata: input.metadata ?? null,
          })
          .select()
          .single();
        if (!error && data) return data as Notification;
        console.error("createDemoNotification", error?.message);
      }
    } catch (error) {
      console.error("createDemoNotification", error);
    }
    return {
      ...input,
      id: crypto.randomUUID(),
      is_read: input.is_read ?? false,
      created_at: new Date().toISOString(),
    };
  }

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
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", id)
          .eq("user_id", user.id);
      }
    } catch (error) {
      console.error("markDemoNotificationRead", error);
    }
    return;
  }

  const items = await readDemoNotifications();
  const next = items.map((item) =>
    item.id === id ? { ...item, is_read: true } : item
  );
  await writeDemoNotifications(next);
}

export async function markAllDemoNotificationsRead() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("user_id", user.id)
          .eq("is_read", false);
      }
    } catch (error) {
      console.error("markAllDemoNotificationsRead", error);
    }
    return;
  }

  const items = await readDemoNotifications();
  await writeDemoNotifications(items.map((item) => ({ ...item, is_read: true })));
}

export async function readDemoNotificationPreferences(
  userId?: string | null
): Promise<NotificationPreferences> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const id = userId ?? user?.id;
      if (id) {
        const client =
          !user || (userId && userId !== user.id)
            ? tryCreateAdminClient() ?? supabase
            : supabase;

        // Prefer full prefs column; fall back when migration 013 is not applied yet
        const full = await client
          .from("profiles")
          .select(
            "notification_email, notification_in_app, notification_preferences"
          )
          .eq("id", id)
          .maybeSingle();

        let data = full.data as {
          notification_email?: boolean;
          notification_in_app?: boolean;
          notification_preferences?: Partial<NotificationPreferences> | null;
        } | null;

        if (
          full.error &&
          /notification_preferences|schema cache/i.test(full.error.message)
        ) {
          const basic = await client
            .from("profiles")
            .select("notification_email, notification_in_app")
            .eq("id", id)
            .maybeSingle();
          data = basic.data as typeof data;
        }

        if (data) {
          const prefs = mergePreferences(data.notification_preferences);
          return {
            ...prefs,
            emailEnabled:
              data.notification_email !== undefined
                ? Boolean(data.notification_email)
                : prefs.emailEnabled,
            inAppEnabled:
              data.notification_in_app !== undefined
                ? Boolean(data.notification_in_app)
                : prefs.inAppEnabled,
          };
        }
      }
    } catch (error) {
      console.error("readDemoNotificationPreferences", error);
    }
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  const store = await cookies();
  const raw = store.get(PREFS_COOKIE)?.value;
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  try {
    return mergePreferences(
      JSON.parse(decodeURIComponent(raw)) as Partial<NotificationPreferences>
    );
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export async function writeDemoNotificationPreferences(
  preferences: NotificationPreferences,
  userId?: string | null
) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const id = userId ?? user?.id;
      if (!id) return;

      const client =
        !user || (userId && userId !== user.id)
          ? tryCreateAdminClient() ?? supabase
          : supabase;

      const full = {
        notification_email: preferences.emailEnabled,
        notification_in_app: preferences.inAppEnabled,
        notification_preferences: preferences,
      };
      const { error } = await client.from("profiles").update(full).eq("id", id);
      if (error && /notification_preferences|schema cache/i.test(error.message)) {
        // Migration 013 not applied yet — keep email/in-app flags in DB
        await client
          .from("profiles")
          .update({
            notification_email: preferences.emailEnabled,
            notification_in_app: preferences.inAppEnabled,
          })
          .eq("id", id);
      } else if (error) {
        console.error("writeDemoNotificationPreferences", error.message);
      }
    } catch (error) {
      console.error("writeDemoNotificationPreferences", error);
    }
    return;
  }

  const store = await cookies();
  store.set(PREFS_COOKIE, encodeURIComponent(JSON.stringify(preferences)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
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
      const admin = tryCreateAdminClient();
      if (admin) {
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
      }
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

export async function readSentReminderIds(userId?: string | null): Promise<string[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const id = userId ?? user?.id;
      if (!id) return [];

      const client =
        userId && user && userId !== user.id
          ? tryCreateAdminClient() ?? supabase
          : !user
            ? tryCreateAdminClient() ?? supabase
            : supabase;
      const { data } = await client
        .from("notifications")
        .select("metadata")
        .eq("user_id", id)
        .not("metadata", "is", null)
        .limit(500);

      return ((data ?? []) as Array<{ metadata: Record<string, unknown> | null }>)
        .map((row) => {
          const reminderId = row.metadata?.reminder_id;
          return typeof reminderId === "string" ? reminderId : null;
        })
        .filter((value): value is string => Boolean(value));
    } catch (error) {
      console.error("readSentReminderIds", error);
      return [];
    }
  }

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
  if (isSupabaseConfigured()) {
    // Live mode records reminder_id on the notification row via dispatchNotification.
    return;
  }

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
