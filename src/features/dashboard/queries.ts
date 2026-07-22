import {
  calculateExpenseTotals,
  buildMonthlyExpenseSeries,
  groupByCategoryMonthly,
} from "@/lib/billing/expenses";
import type { SubscriptionWithCategory } from "@/lib/billing/demo-data";
import { listSubscriptions } from "@/features/subscriptions/queries";

export type DashboardOverview = {
  totals: ReturnType<typeof calculateExpenseTotals>;
  monthlySeries: ReturnType<typeof buildMonthlyExpenseSeries>;
  categoryBreakdown: ReturnType<typeof groupByCategoryMonthly>;
  upcoming: SubscriptionWithCategory[];
  recent: SubscriptionWithCategory[];
  isDemo: boolean;
};

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const { items, isDemo } = await listSubscriptions({
    status: "all",
    sort: "renewal_asc",
  });

  const totals = calculateExpenseTotals(items);
  const monthlySeries = buildMonthlyExpenseSeries(items, 6);
  const categoryBreakdown = groupByCategoryMonthly(
    items.map((item) => ({
      amount: item.amount,
      billing_frequency: item.billing_frequency,
      custom_interval_days: item.custom_interval_days,
      status: item.status,
      categoryName: item.category?.name ?? "Others",
      categoryColor: item.category?.color ?? "#94A3B8",
    }))
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items
    .filter((item) => item.status === "active" && item.next_billing_date >= today)
    .slice(0, 5);

  const recent = [...items]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 6);

  return {
    totals,
    monthlySeries,
    categoryBreakdown,
    upcoming,
    recent,
    isDemo,
  };
}
