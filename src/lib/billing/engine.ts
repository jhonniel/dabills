import type { BillStatus, BillingCycle, BillingFrequency, Subscription } from "@/types";
import { getNextBillingDate } from "@/lib/billing/expenses";

export type SubscriptionLike = Pick<
  Subscription,
  | "id"
  | "user_id"
  | "amount"
  | "currency"
  | "billing_frequency"
  | "custom_interval_days"
  | "start_date"
  | "renewal_date"
  | "next_billing_date"
  | "status"
  | "reminder_days"
  | "auto_renewal"
>;

function toDateOnly(value: string | Date) {
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function subtractInterval(
  dueDate: string,
  frequency: BillingFrequency,
  customIntervalDays?: number | null
) {
  const date = new Date(`${dueDate}T12:00:00.000Z`);
  switch (frequency) {
    case "weekly":
      date.setUTCDate(date.getUTCDate() - 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() - 1);
      break;
    case "quarterly":
      date.setUTCMonth(date.getUTCMonth() - 3);
      break;
    case "semi_annual":
      date.setUTCMonth(date.getUTCMonth() - 6);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() - 1);
      break;
    case "custom":
      date.setUTCDate(date.getUTCDate() - (customIntervalDays ?? 30));
      break;
  }
  return date.toISOString().slice(0, 10);
}

export function resolveBillStatus(
  dueDate: string,
  currentStatus: BillStatus,
  today = toDateOnly(new Date())
): BillStatus {
  if (
    currentStatus === "paid" ||
    currentStatus === "pending_verification" ||
    currentStatus === "failed"
  ) {
    return currentStatus;
  }

  if (dueDate < today) return "overdue";
  if (dueDate === today) return "pending";
  return "upcoming";
}

export function buildBillingCycleDraft(
  subscription: SubscriptionLike,
  dueDate: string,
  today = toDateOnly(new Date())
): Omit<BillingCycle, "id" | "created_at" | "updated_at"> {
  const periodStart = subtractInterval(
    dueDate,
    subscription.billing_frequency,
    subscription.custom_interval_days
  );
  const periodEnd = addDays(dueDate, -1);

  return {
    subscription_id: subscription.id,
    user_id: subscription.user_id,
    amount: subscription.amount,
    currency: subscription.currency,
    due_date: dueDate,
    status: resolveBillStatus(dueDate, "upcoming", today),
    paid_at: null,
    period_start: periodStart < subscription.start_date ? subscription.start_date : periodStart,
    period_end: periodEnd < periodStart ? dueDate : periodEnd,
  };
}

/**
 * Project upcoming due dates for a subscription within a horizon.
 * Starts from next_billing_date (or renewal_date) and walks forward.
 */
export function projectDueDates(
  subscription: SubscriptionLike,
  options?: {
    horizonDays?: number;
    maxCycles?: number;
    fromDate?: string;
  }
): string[] {
  const horizonDays = options?.horizonDays ?? 90;
  const maxCycles = options?.maxCycles ?? 6;
  const today = options?.fromDate ?? toDateOnly(new Date());
  const horizonEnd = addDays(today, horizonDays);

  let cursor =
    subscription.next_billing_date ||
    subscription.renewal_date ||
    subscription.start_date;

  // Walk backward if next billing is far in the future but we missed past dues
  // Ensure we include overdue/current if next_billing is in the past.
  const dates: string[] = [];
  let guard = 0;

  while (cursor <= horizonEnd && dates.length < maxCycles && guard < 50) {
    if (cursor >= subscription.start_date) {
      dates.push(cursor);
    }
    cursor = getNextBillingDate(
      cursor,
      subscription.billing_frequency,
      subscription.custom_interval_days
    );
    guard += 1;
  }

  return dates;
}

export function generateBillingCyclesForSubscription(
  subscription: SubscriptionLike,
  existing: BillingCycle[],
  options?: { horizonDays?: number; maxCycles?: number; today?: string }
): Array<Omit<BillingCycle, "id" | "created_at" | "updated_at">> {
  if (subscription.status !== "active") return [];

  const today = options?.today ?? toDateOnly(new Date());
  const existingKeys = new Set(
    existing
      .filter((cycle) => cycle.subscription_id === subscription.id)
      .map((cycle) => `${cycle.subscription_id}:${cycle.due_date}`)
  );

  return projectDueDates(subscription, {
    horizonDays: options?.horizonDays,
    maxCycles: options?.maxCycles,
    fromDate: today,
  })
    .filter((dueDate) => !existingKeys.has(`${subscription.id}:${dueDate}`))
    .map((dueDate) => buildBillingCycleDraft(subscription, dueDate, today));
}

export function refreshBillingCycleStatuses(
  cycles: BillingCycle[],
  today = toDateOnly(new Date())
): BillingCycle[] {
  return cycles.map((cycle) => ({
    ...cycle,
    status: resolveBillStatus(cycle.due_date, cycle.status, today),
    updated_at: new Date().toISOString(),
  }));
}

export function advanceSubscriptionNextBilling(
  subscription: SubscriptionLike,
  paidDueDate: string
): string {
  return getNextBillingDate(
    paidDueDate,
    subscription.billing_frequency,
    subscription.custom_interval_days
  );
}
