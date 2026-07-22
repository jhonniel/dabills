"use server";

import { revalidatePath } from "next/cache";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { formatMoney } from "@/lib/billing/expenses";
import { readDemoBillingCycles } from "@/lib/billing/demo-bills";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import type { ReminderScheduleItem } from "@/lib/billing/reminders";
import { buildReminderSchedule } from "@/lib/billing/reminders";
import {
  markAllDemoNotificationsRead,
  markDemoNotificationRead,
  markReminderSent,
  readDemoNotificationPreferences,
  readSentReminderIds,
  writeDemoNotificationPreferences,
} from "@/lib/notifications/demo-store";
import { dispatchNotification } from "@/lib/notifications/dispatch";
import { reminderEmailHtml } from "@/emails/templates/reminder";
import {
  paymentApprovedEmailHtml,
  paymentReceivedEmailHtml,
} from "@/emails/templates/payment";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle } from "@/types";
import {
  notificationPreferencesSchema,
  type NotificationPreferences,
} from "@/validators/notification";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function revalidateNotificationPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/settings/notifications");
}

export async function markNotificationReadAction(
  id: string
): Promise<ActionResult> {
  await markDemoNotificationRead(id);

  if (isSupabaseConfigured()) {
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
  }

  revalidateNotificationPaths();
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  await markAllDemoNotificationsRead();

  if (isSupabaseConfigured()) {
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
  }

  revalidateNotificationPaths();
  return { success: true };
}

export async function updateNotificationPreferencesAction(
  input: NotificationPreferences
): Promise<ActionResult> {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid preferences" };
  }

  await writeDemoNotificationPreferences(parsed.data);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          notification_email: parsed.data.emailEnabled,
          notification_in_app: parsed.data.inAppEnabled,
        })
        .eq("id", user.id);
    }
  }

  revalidateNotificationPaths();
  return { success: true };
}

async function resolveReminderContext() {
  const preferences = await readDemoNotificationPreferences();
  const sentIds = await readSentReminderIds();

  if (!isSupabaseConfigured()) {
    const [cycles, subscriptions] = await Promise.all([
      readDemoBillingCycles(),
      readDemoSubscriptions(),
    ]);
    const schedule = buildReminderSchedule({ cycles, subscriptions });
    return {
      schedule,
      preferences,
      sentIds,
      subscriptions,
      email: "demo@dabills.app",
      userId: "demo-user",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const [cycles, subscriptions] = await Promise.all([
      readDemoBillingCycles(),
      readDemoSubscriptions(),
    ]);
    return {
      schedule: buildReminderSchedule({ cycles, subscriptions }),
      preferences,
      sentIds,
      subscriptions,
      email: "demo@dabills.app",
      userId: "demo-user",
    };
  }

  const [{ data: cycles }, { data: subscriptions }] = await Promise.all([
    supabase.from("billing_cycles").select("*").eq("user_id", user.id),
    supabase
      .from("subscriptions")
      .select("id, user_id, reminder_days, status, name, amount, currency")
      .eq("user_id", user.id),
  ]);

  return {
    schedule: buildReminderSchedule({
      cycles: (cycles ?? []) as BillingCycle[],
      subscriptions: (subscriptions ?? []) as Array<{
        id: string;
        user_id: string;
        reminder_days: number[];
        status: "active" | "paused" | "cancelled";
      }>,
    }),
    preferences,
    sentIds,
    subscriptions: (subscriptions ?? []) as Array<{
      id: string;
      name?: string;
      amount?: number;
      currency?: string;
      user_id: string;
      reminder_days: number[];
      status: "active" | "paused" | "cancelled";
    }>,
    email: user.email ?? "user@dabills.app",
    userId: user.id,
  };
}

export async function processDueRemindersAction(options?: {
  onlyToday?: boolean;
}): Promise<
  ActionResult<{ processed: number; skipped: number; errors: number }>
> {
  const today = new Date().toISOString().slice(0, 10);
  const ctx = await resolveReminderContext();
  const due = ctx.schedule.filter((item) =>
    options?.onlyToday === false
      ? item.scheduled_for <= today
      : item.scheduled_for === today
  );

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  const subMap = new Map(
    ctx.subscriptions.map((sub) => [
      sub.id,
      sub as {
        id: string;
        name?: string;
        amount?: number;
        currency?: string;
      },
    ])
  );

  for (const item of due) {
    if (ctx.sentIds.includes(item.id)) {
      skipped += 1;
      continue;
    }

    try {
      await sendReminderNotification(item, {
        preferences: ctx.preferences,
        email: ctx.email,
        userId: ctx.userId,
        subscriptionName: subMap.get(item.subscription_id)?.name ?? "Subscription",
        amount: Number(subMap.get(item.subscription_id)?.amount ?? 0),
        currency: subMap.get(item.subscription_id)?.currency ?? "USD",
      });
      await markReminderSent(item.id);
      processed += 1;
    } catch (error) {
      console.error("processDueRemindersAction", error);
      errors += 1;
    }
  }

  revalidateNotificationPaths();
  return { success: true, data: { processed, skipped, errors } };
}

async function sendReminderNotification(
  item: ReminderScheduleItem,
  ctx: {
    preferences: NotificationPreferences;
    email: string;
    userId: string;
    subscriptionName: string;
    amount: number;
    currency: string;
  }
) {
  const amountLabel = formatMoney(ctx.amount, ctx.currency);
  const titles: Record<ReminderScheduleItem["type"], string> = {
    reminder_5d: `${ctx.subscriptionName} due in 5 days`,
    reminder_3d: `${ctx.subscriptionName} due in 3 days`,
    reminder_1d: `${ctx.subscriptionName} due tomorrow`,
    due_today: `${ctx.subscriptionName} due today`,
    overdue: `${ctx.subscriptionName} is overdue`,
  };

  const bodies: Record<ReminderScheduleItem["type"], string> = {
    reminder_5d: `Renews on ${item.due_date} · ${amountLabel}`,
    reminder_3d: `Renews on ${item.due_date} · ${amountLabel}`,
    reminder_1d: `Due ${item.due_date} · ${amountLabel}`,
    due_today: `Due today (${item.due_date}) · ${amountLabel}`,
    overdue: `Was due ${item.due_date} · ${amountLabel}`,
  };

  const billingUrl = `${getAppUrl()}/dashboard/billing`;

  await dispatchNotification({
    userId: ctx.userId,
    email: ctx.email,
    type: item.type,
    title: titles[item.type],
    body: bodies[item.type],
    href: "/dashboard/billing",
    emailSubject: titles[item.type],
    emailTemplate: `reminder_${item.type}`,
    emailHtml: reminderEmailHtml({
      type: item.type,
      subscriptionName: ctx.subscriptionName,
      dueDate: item.due_date,
      amountLabel,
      billingUrl,
    }),
    preferences: ctx.preferences,
    metadata: {
      billing_cycle_id: item.billing_cycle_id,
      subscription_id: item.subscription_id,
      reminder_id: item.id,
    },
  });
}

export async function notifyPaymentReceivedAction(input: {
  userId: string;
  email?: string | null;
  subscriptionName: string;
  amount: number;
  currency: string;
  reference?: string | null;
}) {
  const preferences = await readDemoNotificationPreferences();
  const amountLabel = formatMoney(input.amount, input.currency);
  const paymentsUrl = `${getAppUrl()}/dashboard/payments`;

  await dispatchNotification({
    userId: input.userId,
    email: input.email ?? "demo@dabills.app",
    type: "payment_received",
    title: "Payment received",
    body: `Receipt for ${input.subscriptionName} (${amountLabel}) is pending verification.`,
    href: "/dashboard/payments",
    emailSubject: `Payment received · ${input.subscriptionName}`,
    emailTemplate: "payment_received",
    emailHtml: paymentReceivedEmailHtml({
      subscriptionName: input.subscriptionName,
      amountLabel,
      reference: input.reference,
      paymentsUrl,
    }),
    preferences,
  });

  revalidateNotificationPaths();
}

export async function notifyPaymentApprovedAction(input: {
  userId: string;
  email?: string | null;
  subscriptionName: string;
  amount: number;
  currency: string;
}) {
  const preferences = await readDemoNotificationPreferences();
  const amountLabel = formatMoney(input.amount, input.currency);
  const paymentsUrl = `${getAppUrl()}/dashboard/payments`;

  await dispatchNotification({
    userId: input.userId,
    email: input.email ?? "demo@dabills.app",
    type: "payment_approved",
    title: "Payment approved",
    body: `${input.subscriptionName} (${amountLabel}) was approved and marked paid.`,
    href: "/dashboard/payments",
    emailSubject: `Payment approved · ${input.subscriptionName}`,
    emailTemplate: "payment_approved",
    emailHtml: paymentApprovedEmailHtml({
      subscriptionName: input.subscriptionName,
      amountLabel,
      paymentsUrl,
    }),
    preferences,
  });

  revalidateNotificationPaths();
}

/** Manual trigger for demos / QA from settings page */
export async function sendTestReminderAction(): Promise<ActionResult> {
  const preferences = await readDemoNotificationPreferences();
  await dispatchNotification({
    userId: "demo-user",
    email: "demo@dabills.app",
    type: "reminder_1d",
    title: "Test reminder: bill due tomorrow",
    body: "This is a test notification from DaBills settings.",
    href: "/dashboard/billing",
    emailSubject: "DaBills test reminder",
    emailTemplate: "reminder_test",
    emailHtml: reminderEmailHtml({
      type: "reminder_1d",
      subscriptionName: "Demo Subscription",
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      amountLabel: formatMoney(12.99),
      billingUrl: `${getAppUrl()}/dashboard/billing`,
    }),
    preferences,
  });
  revalidateNotificationPaths();
  return { success: true };
}
