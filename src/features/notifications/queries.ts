import { isSupabaseConfigured } from "@/lib/env";
import {
  readDemoEmailLogs,
  readDemoNotificationPreferences,
  readDemoNotifications,
} from "@/lib/notifications/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { EmailLog, Notification } from "@/types";
import type { NotificationPreferences } from "@/validators/notification";

export async function listNotifications() {
  if (!isSupabaseConfigured()) {
    const items = await readDemoNotifications();
    return {
      items,
      unreadCount: items.filter((item) => !item.is_read).length,
      isDemo: true as const,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      items: [] as Notification[],
      unreadCount: 0,
      isDemo: false as const,
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("listNotifications", error.message);
    return {
      items: [] as Notification[],
      unreadCount: 0,
      isDemo: false as const,
    };
  }

  const items = (data ?? []) as Notification[];
  return {
    items,
    unreadCount: items.filter((item) => !item.is_read).length,
    isDemo: false as const,
  };
}

export async function getNotificationPreferences(): Promise<{
  preferences: NotificationPreferences;
  isDemo: boolean;
}> {
  if (!isSupabaseConfigured()) {
    return {
      preferences: await readDemoNotificationPreferences(),
      isDemo: true,
    };
  }

  const preferences = await readDemoNotificationPreferences();
  return { preferences, isDemo: false };
}

export async function listEmailLogs() {
  if (!isSupabaseConfigured()) {
    return readDemoEmailLogs();
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.error("listEmailLogs", error.message);
      return [] as EmailLog[];
    }
    return (data ?? []) as EmailLog[];
  } catch (error) {
    console.error("listEmailLogs", error);
    return [] as EmailLog[];
  }
}
