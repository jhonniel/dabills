import { cookies } from "next/headers";

import type { BillingCycle } from "@/types";
import type { SubscriptionWithCategory } from "@/lib/billing/demo-data";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import {
  generateBillingCyclesForSubscription,
  refreshBillingCycleStatuses,
  type SubscriptionLike,
} from "@/lib/billing/engine";

const DEMO_BILLS_COOKIE = "dabills_demo_billing_cycles_v2";

function stamp(
  draft: Omit<BillingCycle, "id" | "created_at" | "updated_at">,
  id?: string
): BillingCycle {
  const now = new Date().toISOString();
  return {
    ...draft,
    id: id ?? `demo-bill-${draft.subscription_id}-${draft.due_date}`,
    created_at: now,
    updated_at: now,
  };
}

function seedFromSubscriptions(subscriptions: SubscriptionWithCategory[]) {
  const cycles: BillingCycle[] = [];
  for (const subscription of subscriptions) {
    const drafts = generateBillingCyclesForSubscription(
      subscription as SubscriptionLike,
      [],
      { horizonDays: 120, maxCycles: 4 }
    );
    for (const draft of drafts) {
      cycles.push(stamp(draft));
    }
  }
  return refreshBillingCycleStatuses(cycles);
}

export async function readDemoBillingCycles(): Promise<BillingCycle[]> {
  const store = await cookies();
  const raw = store.get(DEMO_BILLS_COOKIE)?.value;
  if (!raw) {
    const subscriptions = await readDemoSubscriptions();
    return seedFromSubscriptions(subscriptions);
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as BillingCycle[];
    return Array.isArray(parsed)
      ? refreshBillingCycleStatuses(parsed)
      : seedFromSubscriptions(await readDemoSubscriptions());
  } catch {
    return seedFromSubscriptions(await readDemoSubscriptions());
  }
}

async function writeDemoBillingCycles(items: BillingCycle[]) {
  const store = await cookies();
  store.set(DEMO_BILLS_COOKIE, encodeURIComponent(JSON.stringify(items)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function generateDemoBillingCycles(options?: {
  horizonDays?: number;
  maxCycles?: number;
}) {
  const [subscriptions, existing] = await Promise.all([
    readDemoSubscriptions(),
    readDemoBillingCycles(),
  ]);

  const created: BillingCycle[] = [];
  for (const subscription of subscriptions) {
    const drafts = generateBillingCyclesForSubscription(
      subscription as SubscriptionLike,
      existing,
      options
    );
    for (const draft of drafts) {
      created.push(stamp(draft));
    }
  }

  const next = refreshBillingCycleStatuses([...existing, ...created]);
  await writeDemoBillingCycles(next);
  return { created: created.length, total: next.length, cycles: next };
}

export async function refreshDemoBillStatuses() {
  const existing = await readDemoBillingCycles();
  const next = refreshBillingCycleStatuses(existing);
  await writeDemoBillingCycles(next);
  return next;
}

export async function updateDemoBillStatus(
  id: string,
  status: BillingCycle["status"]
) {
  const existing = await readDemoBillingCycles();
  const index = existing.findIndex((cycle) => cycle.id === id);
  if (index < 0) return null;

  const updated: BillingCycle = {
    ...existing[index],
    status,
    paid_at: status === "paid" ? new Date().toISOString() : existing[index].paid_at,
    updated_at: new Date().toISOString(),
  };

  const next = [...existing];
  next[index] = updated;
  await writeDemoBillingCycles(next);
  return updated;
}

export async function deleteDemoBillsForSubscription(subscriptionId: string) {
  const existing = await readDemoBillingCycles();
  await writeDemoBillingCycles(
    existing.filter((cycle) => cycle.subscription_id !== subscriptionId)
  );
}

export async function ensureDemoBillsForSubscription(
  subscription: SubscriptionLike
) {
  const existing = await readDemoBillingCycles();
  const drafts = generateBillingCyclesForSubscription(subscription, existing, {
    horizonDays: 120,
    maxCycles: 4,
  });
  if (drafts.length === 0) return existing;

  const created = drafts.map((draft) => stamp(draft));
  const next = refreshBillingCycleStatuses([...existing, ...created]);
  await writeDemoBillingCycles(next);
  return next;
}

/**
 * Apply a new plan price going forward only.
 * Past / due / paid bills keep their original amount.
 */
export async function applyDemoPlanPriceForward(
  planId: string,
  amount: number,
  currency?: string
) {
  const today = new Date().toISOString().slice(0, 10);
  const { readDemoSubscriptions, writeDemoSubscriptionsForPriceSync } =
    await import("@/lib/billing/demo-store");

  const subscriptions = await readDemoSubscriptions();
  const linkedIds = new Set<string>();
  const nextSubs = subscriptions.map((sub) => {
    if (
      sub.plan_id !== planId ||
      (sub.status !== "active" && sub.status !== "paused")
    ) {
      return sub;
    }
    linkedIds.add(sub.id);
    return {
      ...sub,
      amount,
      currency: currency ?? sub.currency,
      updated_at: new Date().toISOString(),
    };
  });
  await writeDemoSubscriptionsForPriceSync(nextSubs);

  const cycles = await readDemoBillingCycles();
  const nextCycles = cycles.map((cycle) => {
    if (!linkedIds.has(cycle.subscription_id)) return cycle;
    // Only future unpaid upcoming bills get the new price
    if (cycle.due_date <= today) return cycle;
    if (
      cycle.status === "paid" ||
      cycle.status === "pending_verification" ||
      cycle.status === "failed" ||
      cycle.status === "overdue" ||
      cycle.status === "pending"
    ) {
      return cycle;
    }
    return {
      ...cycle,
      amount,
      currency: currency ?? cycle.currency,
      updated_at: new Date().toISOString(),
    };
  });
  await writeDemoBillingCycles(nextCycles);

  return { seatsUpdated: linkedIds.size };
}
