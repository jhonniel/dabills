import type { BillingFrequency, Subscription } from "@/types";

/** Normalize any billing amount to an equivalent monthly cost. */
export function toMonthlyAmount(
  amount: number,
  frequency: BillingFrequency,
  customIntervalDays?: number | null
): number {
  switch (frequency) {
    case "weekly":
      return (amount * 52) / 12;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "semi_annual":
      return amount / 6;
    case "yearly":
      return amount / 12;
    case "custom": {
      const days = customIntervalDays && customIntervalDays > 0 ? customIntervalDays : 30;
      return (amount * 30) / days;
    }
    default:
      return amount;
  }
}

export function toYearlyAmount(
  amount: number,
  frequency: BillingFrequency,
  customIntervalDays?: number | null
): number {
  return toMonthlyAmount(amount, frequency, customIntervalDays) * 12;
}

export function calculateExpenseTotals(
  subscriptions: Array<
    Pick<Subscription, "amount" | "billing_frequency" | "custom_interval_days" | "status">
  >
) {
  const active = subscriptions.filter((s) => s.status === "active");

  const monthly = active.reduce(
    (sum, s) =>
      sum + toMonthlyAmount(s.amount, s.billing_frequency, s.custom_interval_days),
    0
  );

  return {
    monthly,
    yearly: monthly * 12,
    activeCount: active.length,
    pausedCount: subscriptions.filter((s) => s.status === "paused").length,
    cancelledCount: subscriptions.filter((s) => s.status === "cancelled").length,
    totalCount: subscriptions.length,
  };
}

export function groupByCategoryMonthly(
  subscriptions: Array<{
    amount: number;
    billing_frequency: BillingFrequency;
    custom_interval_days: number | null;
    status: Subscription["status"];
    categoryName: string;
    categoryColor: string;
  }>
) {
  const map = new Map<string, { name: string; color: string; monthly: number }>();

  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;
    const key = sub.categoryName || "Others";
    const current = map.get(key) ?? {
      name: key,
      color: sub.categoryColor || "#94A3B8",
      monthly: 0,
    };
    current.monthly += toMonthlyAmount(
      sub.amount,
      sub.billing_frequency,
      sub.custom_interval_days
    );
    map.set(key, current);
  }

  return Array.from(map.values()).sort((a, b) => b.monthly - a.monthly);
}

/** Approximate spend for the last N months based on active recurring amounts. */
export function buildMonthlyExpenseSeries(
  subscriptions: Array<
    Pick<
      Subscription,
      "amount" | "billing_frequency" | "custom_interval_days" | "status" | "start_date"
    >
  >,
  months = 6
) {
  const now = new Date();
  const series: Array<{ month: string; total: number }> = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const total = subscriptions.reduce((sum, sub) => {
      if (sub.status === "cancelled") return sum;
      const start = new Date(sub.start_date);
      if (start > monthEnd) return sum;
      return (
        sum +
        toMonthlyAmount(sub.amount, sub.billing_frequency, sub.custom_interval_days)
      );
    }, 0);

    series.push({ month: label, total: Number(total.toFixed(2)) });
  }

  return series;
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getNextBillingDate(
  fromDate: string,
  frequency: BillingFrequency,
  customIntervalDays?: number | null
): string {
  const date = new Date(fromDate);
  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "semi_annual":
      date.setMonth(date.getMonth() + 6);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    case "custom":
      date.setDate(date.getDate() + (customIntervalDays ?? 30));
      break;
  }
  return date.toISOString().slice(0, 10);
}
