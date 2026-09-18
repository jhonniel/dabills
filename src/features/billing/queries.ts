import { isSupabaseConfigured } from "@/lib/env";
import { readDemoBillingCycles } from "@/lib/billing/demo-bills";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import type { SubscriptionWithCategory } from "@/lib/billing/demo-data";
import { buildReminderSchedule } from "@/lib/billing/reminders";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle } from "@/types";
import {
  billingFiltersSchema,
  type BillingFilters,
} from "@/validators/billing";

export type BillingCycleWithSubscription = BillingCycle & {
  subscription: Pick<
    SubscriptionWithCategory,
    "id" | "name" | "category" | "billing_frequency" | "status" | "reminder_days"
  > | null;
};

function applyFilters(
  items: BillingCycleWithSubscription[],
  filters: BillingFilters
) {
  let result = [...items];
  const today = new Date().toISOString().slice(0, 10);
  const horizon = filters.horizon ?? "past";

  if (horizon === "past") {
    result = result.filter((item) => item.due_date <= today);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.subscription?.name.toLowerCase().includes(q) ||
        item.status.includes(q) ||
        item.due_date.includes(q)
    );
  }

  if (filters.status && filters.status !== "all") {
    result = result.filter((item) => item.status === filters.status);
  }

  if (filters.month) {
    result = result.filter((item) => item.due_date.startsWith(filters.month!));
  }

  result.sort((a, b) =>
    horizon === "past"
      ? b.due_date.localeCompare(a.due_date)
      : a.due_date.localeCompare(b.due_date)
  );
  return result;
}

async function attachSubscriptions(
  cycles: BillingCycle[],
  subscriptions: SubscriptionWithCategory[]
): Promise<BillingCycleWithSubscription[]> {
  const map = new Map(subscriptions.map((sub) => [sub.id, sub]));
  return cycles.map((cycle) => {
    const subscription = map.get(cycle.subscription_id) ?? null;
    return {
      ...cycle,
      subscription: subscription
        ? {
            id: subscription.id,
            name: subscription.name,
            category: subscription.category,
            billing_frequency: subscription.billing_frequency,
            status: subscription.status,
            reminder_days: subscription.reminder_days,
          }
        : null,
    };
  });
}

export async function listBillingCycles(filters: BillingFilters = {}) {
  const parsed = billingFiltersSchema.parse(filters);

  if (!isSupabaseConfigured()) {
    const [cycles, subscriptions] = await Promise.all([
      readDemoBillingCycles(),
      readDemoSubscriptions(),
    ]);
    const items = applyFilters(
      await attachSubscriptions(cycles, subscriptions),
      parsed
    );
    return { items, isDemo: true as const };
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
    const items = applyFilters(
      await attachSubscriptions(cycles, subscriptions),
      parsed
    );
    return { items, isDemo: true as const };
  }

  let query = supabase
    .from("billing_cycles")
    .select(
      "*, subscription:subscriptions(id, name, billing_frequency, status, reminder_days, category:categories(id, slug, name, icon, color))"
    )
    .eq("user_id", user.id);

  const horizon = parsed.horizon ?? "past";
  const today = new Date().toISOString().slice(0, 10);
  if (horizon === "past") {
    query = query.lte("due_date", today).order("due_date", { ascending: false });
  } else {
    query = query.order("due_date", { ascending: true });
  }

  if (parsed.status && parsed.status !== "all") {
    query = query.eq("status", parsed.status);
  }

  if (parsed.month) {
    const start = `${parsed.month}-01`;
    const [year, month] = parsed.month.split("-").map(Number);
    const endDate = new Date(Date.UTC(year, month, 0));
    const end = endDate.toISOString().slice(0, 10);
    query = query.gte("due_date", start).lte("due_date", end);
  }

  const { data, error } = await query;
  if (error) {
    console.error("listBillingCycles", error.message);
    return { items: [] as BillingCycleWithSubscription[], isDemo: false as const };
  }

  let items = (data ?? []).map((row) => {
    const record = row as BillingCycle & {
      subscription?: BillingCycleWithSubscription["subscription"] | Array<BillingCycleWithSubscription["subscription"]>;
    };
    const subscription = Array.isArray(record.subscription)
      ? record.subscription[0] ?? null
      : record.subscription ?? null;
    return { ...record, subscription };
  });

  if (parsed.search) {
    const q = parsed.search.toLowerCase();
    items = items.filter((item) =>
      item.subscription?.name.toLowerCase().includes(q)
    );
  }

  return { items, isDemo: false as const };
}

export async function getBillingOverview() {
  const { items, isDemo } = await listBillingCycles({
    status: "all",
    horizon: "past",
  });

  const counts = {
    pending: items.filter((i) => i.status === "pending").length,
    overdue: items.filter((i) => i.status === "overdue").length,
    paid: items.filter((i) => i.status === "paid").length,
    pendingVerification: items.filter(
      (i) => i.status === "pending_verification"
    ).length,
  };

  const amountDue = items
    .filter((i) => ["pending", "overdue", "pending_verification"].includes(i.status))
    .reduce((sum, i) => sum + Number(i.amount), 0);

  return { counts, amountDue, items, isDemo };
}

export async function getReminderSchedulePreview() {
  const [{ items }, subscriptions] = await Promise.all([
    listBillingCycles({ status: "all", horizon: "all" }),
    !isSupabaseConfigured()
      ? readDemoSubscriptions()
      : (async () => {
          const supabase = await createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return readDemoSubscriptions();
          const { data } = await supabase
            .from("subscriptions")
            .select("id, user_id, reminder_days, status")
            .eq("user_id", user.id);
          return (data ?? []) as Array<{
            id: string;
            user_id: string;
            reminder_days: number[];
            status: "active" | "paused" | "cancelled";
          }>;
        })(),
  ]);

  return buildReminderSchedule({
    cycles: items,
    subscriptions,
  });
}
