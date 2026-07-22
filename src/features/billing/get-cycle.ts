import { isSupabaseConfigured } from "@/lib/env";
import { readDemoBillingCycles } from "@/lib/billing/demo-bills";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import type { BillingCycleWithSubscription } from "@/features/billing/queries";
import { createClient } from "@/lib/supabase/server";

async function fromDemo(id: string, isDemo: boolean) {
  const [cycles, subscriptions] = await Promise.all([
    readDemoBillingCycles(),
    readDemoSubscriptions(),
  ]);
  const cycle = cycles.find((item) => item.id === id);
  if (!cycle) return { item: null, isDemo };

  const subscription = subscriptions.find((sub) => sub.id === cycle.subscription_id);
  return {
    item: {
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
    } satisfies BillingCycleWithSubscription,
    isDemo,
  };
}

export async function getBillingCycle(id: string) {
  if (!isSupabaseConfigured()) {
    return fromDemo(id, true);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fromDemo(id, true);
  }

  const { data, error } = await supabase
    .from("billing_cycles")
    .select(
      "*, subscription:subscriptions(id, name, billing_frequency, status, reminder_days, category:categories(id, slug, name, icon, color))"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return fromDemo(id, true);
  }

  const record = data as BillingCycleWithSubscription & {
    subscription?:
      | BillingCycleWithSubscription["subscription"]
      | Array<BillingCycleWithSubscription["subscription"]>;
  };
  const subscription = Array.isArray(record.subscription)
    ? record.subscription[0] ?? null
    : record.subscription ?? null;

  return { item: { ...record, subscription }, isDemo: false as const };
}
