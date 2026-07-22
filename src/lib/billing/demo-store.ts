import { cookies } from "next/headers";

import {
  DEMO_CATEGORIES,
  DEMO_SUBSCRIPTIONS,
  type SubscriptionWithCategory,
} from "@/lib/billing/demo-data";
import { getNextBillingDate } from "@/lib/billing/expenses";
import type { SubscriptionInput } from "@/validators/subscription";

const DEMO_COOKIE = "dabills_demo_subscriptions";

export async function readDemoSubscriptions(): Promise<SubscriptionWithCategory[]> {
  const store = await cookies();
  const raw = store.get(DEMO_COOKIE)?.value;
  if (!raw) return DEMO_SUBSCRIPTIONS;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as SubscriptionWithCategory[];
    return Array.isArray(parsed) ? parsed : DEMO_SUBSCRIPTIONS;
  } catch {
    return DEMO_SUBSCRIPTIONS;
  }
}

async function writeDemoSubscriptions(items: SubscriptionWithCategory[]) {
  const store = await cookies();
  store.set(DEMO_COOKIE, encodeURIComponent(JSON.stringify(items)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

function attachCategory(
  item: Omit<SubscriptionWithCategory, "category">
): SubscriptionWithCategory {
  const category =
    DEMO_CATEGORIES.find((c) => c.id === item.category_id) ?? null;
  return { ...item, category };
}

export async function createDemoSubscription(input: SubscriptionInput) {
  const items = await readDemoSubscriptions();
  const nextBilling = getNextBillingDate(
    input.renewalDate,
    input.billingFrequency,
    input.customIntervalDays
  );

  const created = attachCategory({
    id: crypto.randomUUID(),
    user_id: "demo-user",
    category_id: input.categoryId ?? null,
    name: input.name,
    logo_url: input.logoUrl || null,
    amount: input.amount,
    currency: input.currency || "USD",
    billing_frequency: input.billingFrequency,
    custom_interval_days: input.customIntervalDays ?? null,
    start_date: input.startDate,
    renewal_date: input.renewalDate,
    next_billing_date: nextBilling,
    auto_renewal: input.autoRenewal,
    reminder_days: input.reminderDays,
    status: input.status,
    notes: input.notes ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  await writeDemoSubscriptions([created, ...items]);
  return created;
}

export async function updateDemoSubscription(
  id: string,
  input: SubscriptionInput
) {
  const items = await readDemoSubscriptions();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const nextBilling = getNextBillingDate(
    input.renewalDate,
    input.billingFrequency,
    input.customIntervalDays
  );

  const updated = attachCategory({
    ...items[index],
    category_id: input.categoryId ?? null,
    name: input.name,
    logo_url: input.logoUrl || null,
    amount: input.amount,
    currency: input.currency || "USD",
    billing_frequency: input.billingFrequency,
    custom_interval_days: input.customIntervalDays ?? null,
    start_date: input.startDate,
    renewal_date: input.renewalDate,
    next_billing_date: nextBilling,
    auto_renewal: input.autoRenewal,
    reminder_days: input.reminderDays,
    status: input.status,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString(),
  });

  const next = [...items];
  next[index] = updated;
  await writeDemoSubscriptions(next);
  return updated;
}

export async function deleteDemoSubscription(id: string) {
  const items = await readDemoSubscriptions();
  await writeDemoSubscriptions(items.filter((item) => item.id !== id));
}

export function getDemoCategories() {
  return DEMO_CATEGORIES;
}
