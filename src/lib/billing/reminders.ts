import type { BillStatus, BillingCycle, NotificationType, Subscription } from "@/types";

export type ReminderScheduleItem = {
  id: string;
  billing_cycle_id: string;
  subscription_id: string;
  user_id: string;
  type: Extract<
    NotificationType,
    "reminder_5d" | "reminder_3d" | "reminder_1d" | "due_today" | "overdue"
  >;
  scheduled_for: string;
  due_date: string;
  status: "scheduled" | "sent" | "skipped";
  channel: "email" | "in_app";
};

function addDays(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function reminderTypeForOffset(
  daysBefore: number
): ReminderScheduleItem["type"] | null {
  if (daysBefore === 5) return "reminder_5d";
  if (daysBefore === 3) return "reminder_3d";
  if (daysBefore === 1) return "reminder_1d";
  if (daysBefore === 0) return "due_today";
  return null;
}

/**
 * Cron-ready reminder planner.
 * Phase 5 will consume these rows to send Resend emails + in-app notifications.
 */
export function buildReminderSchedule(input: {
  cycles: BillingCycle[];
  subscriptions: Array<
    Pick<Subscription, "id" | "user_id" | "reminder_days" | "status">
  >;
  today?: string;
  horizonDays?: number;
}): ReminderScheduleItem[] {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const horizonEnd = addDays(today, input.horizonDays ?? 14);
  const subMap = new Map(input.subscriptions.map((sub) => [sub.id, sub]));
  const items: ReminderScheduleItem[] = [];

  for (const cycle of input.cycles) {
    if (
      cycle.status === "paid" ||
      cycle.status === "failed" ||
      cycle.status === "pending_verification"
    ) {
      continue;
    }

    const subscription = subMap.get(cycle.subscription_id);
    if (!subscription || subscription.status !== "active") continue;

    const offsets = Array.from(
      new Set([...(subscription.reminder_days ?? [5, 3, 1]), 0])
    ).sort((a, b) => b - a);

    for (const offset of offsets) {
      const type = reminderTypeForOffset(offset);
      if (!type) continue;

      const scheduledFor = addDays(cycle.due_date, -offset);
      if (scheduledFor < today || scheduledFor > horizonEnd) continue;

      items.push({
        id: `${cycle.id}:${type}:${scheduledFor}`,
        billing_cycle_id: cycle.id,
        subscription_id: cycle.subscription_id,
        user_id: cycle.user_id,
        type,
        scheduled_for: scheduledFor,
        due_date: cycle.due_date,
        status: "scheduled",
        channel: "email",
      });
    }

    if (cycle.status === "overdue" || cycle.due_date < today) {
      items.push({
        id: `${cycle.id}:overdue:${today}`,
        billing_cycle_id: cycle.id,
        subscription_id: cycle.subscription_id,
        user_id: cycle.user_id,
        type: "overdue",
        scheduled_for: today,
        due_date: cycle.due_date,
        status: "scheduled",
        channel: "email",
      });
    }
  }

  return items.sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));
}

export function billStatusLabel(status: BillStatus) {
  return status.replaceAll("_", " ");
}
