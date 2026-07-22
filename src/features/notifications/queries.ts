import { isSupabaseConfigured } from "@/lib/env";
import {
  readDemoEmailLogs,
  readDemoNotificationPreferences,
  readDemoNotifications,
} from "@/lib/notifications/demo-store";
import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";
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
    const items = await readDemoNotifications();
    return {
      items,
      unreadCount: items.filter((item) => !item.is_read).length,
      isDemo: true as const,
    };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    const items = await readDemoNotifications();
    return {
      items,
      unreadCount: items.filter((item) => !item.is_read).length,
      isDemo: true as const,
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
  // Phase 5 stores detailed prefs in demo cookie; profile flags cover email/in-app in DB.
  const preferences = await readDemoNotificationPreferences();

  if (!isSupabaseConfigured()) {
    return { preferences, isDemo: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { preferences, isDemo: true };

  const { data } = await supabase
    .from("profiles")
    .select("notification_email, notification_in_app")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) return { preferences, isDemo: false };

  return {
    preferences: {
      ...preferences,
      emailEnabled: Boolean(
        (data as { notification_email?: boolean }).notification_email
      ),
      inAppEnabled: Boolean(
        (data as { notification_in_app?: boolean }).notification_in_app
      ),
    },
    isDemo: false,
  };
}

export async function listEmailLogs() {
  return readDemoEmailLogs();
}
