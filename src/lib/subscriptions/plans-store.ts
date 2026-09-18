import { cookies } from "next/headers";

import { DEMO_CATEGORIES } from "@/lib/billing/demo-data";
import {
  DEFAULT_CURRENCY,
  SHOWCASE_SUBSCRIPTIONS,
} from "@/lib/constants";
import type { SubscriptionPlan, SubscriptionPlanWithSeats } from "@/types";
import type { SubscriptionPlanInput } from "@/validators/subscription-plan";

const PLANS_COOKIE = "dabills_demo_subscription_plans_v3";

const CAPACITY_BY_CATEGORY: Record<string, number> = {
  Streaming: 4,
  Software: 5,
  Cloud: 5,
  Internet: 1,
  Gaming: 1,
};

function seedPlans(): SubscriptionPlan[] {
  const now = new Date().toISOString();
  return SHOWCASE_SUBSCRIPTIONS.map((item, index) => {
    const category =
      DEMO_CATEGORIES.find(
        (c) => c.name.toLowerCase() === item.category.toLowerCase()
      ) ?? null;

    return {
      id: `plan-showcase-${String(index + 1).padStart(2, "0")}`,
      name: item.name,
      category_id: category?.id ?? null,
      logo_url: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.domain)}&sz=128`,
      amount: item.price,
      currency: DEFAULT_CURRENCY,
      billing_frequency: "monthly" as const,
      custom_interval_days: null,
      max_capacity: CAPACITY_BY_CATEGORY[item.category] ?? 4,
      status: "active" as const,
      notes:
        item.price === 0
          ? `${item.category} · variable billing`
          : `${item.category} · from landing showcase`,
      created_at: now,
      updated_at: now,
    };
  });
}

async function readJsonCookie<T>(name: string, fallback: T): Promise<T> {
  const store = await cookies();
  const raw = store.get(name)?.value;
  if (!raw) return fallback;
  try {
    return JSON.parse(decodeURIComponent(raw)) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonCookie<T>(name: string, value: T) {
  const store = await cookies();
  store.set(name, encodeURIComponent(JSON.stringify(value)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function readDemoSubscriptionPlans() {
  return readJsonCookie(PLANS_COOKIE, seedPlans());
}

export async function writeDemoSubscriptionPlans(items: SubscriptionPlan[]) {
  await writeJsonCookie(PLANS_COOKIE, items);
}

export async function createDemoSubscriptionPlan(input: SubscriptionPlanInput) {
  const items = await readDemoSubscriptionPlans();
  const now = new Date().toISOString();
  const created: SubscriptionPlan = {
    id: crypto.randomUUID(),
    name: input.name,
    category_id: input.categoryId ?? null,
    logo_url: input.logoUrl || null,
    amount: input.amount,
    currency: input.currency || "PHP",
    billing_frequency: input.billingFrequency,
    custom_interval_days: input.customIntervalDays ?? null,
    max_capacity: input.maxCapacity,
    status: input.status ?? "active",
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
  };
  await writeDemoSubscriptionPlans([created, ...items]);
  return created;
}

export async function updateDemoSubscriptionPlan(
  id: string,
  input: Partial<SubscriptionPlanInput> & { status?: SubscriptionPlan["status"] }
) {
  const items = await readDemoSubscriptionPlans();
  const index = items.findIndex((p) => p.id === id);
  if (index < 0) return null;

  const current = items[index];
  const updated: SubscriptionPlan = {
    ...current,
    name: input.name ?? current.name,
    category_id:
      input.categoryId !== undefined ? input.categoryId ?? null : current.category_id,
    logo_url:
      input.logoUrl !== undefined ? input.logoUrl || null : current.logo_url,
    amount: input.amount ?? current.amount,
    currency: input.currency ?? current.currency,
    billing_frequency: input.billingFrequency ?? current.billing_frequency,
    custom_interval_days:
      input.customIntervalDays !== undefined
        ? input.customIntervalDays ?? null
        : current.custom_interval_days,
    max_capacity: input.maxCapacity ?? current.max_capacity,
    status: input.status ?? current.status,
    notes: input.notes !== undefined ? input.notes ?? null : current.notes,
    updated_at: new Date().toISOString(),
  };

  const next = [...items];
  next[index] = updated;
  await writeDemoSubscriptionPlans(next);
  return updated;
}

export async function archiveDemoSubscriptionPlan(id: string) {
  return updateDemoSubscriptionPlan(id, { status: "archived" });
}

export async function deleteDemoSubscriptionPlan(id: string) {
  const items = await readDemoSubscriptionPlans();
  const next = items.filter((plan) => plan.id !== id);
  if (next.length === items.length) return false;
  await writeDemoSubscriptionPlans(next);
  return true;
}

export async function listDemoSubscriptionPlansWithSeats(
  seatCounter: (planId: string) => Promise<number>
): Promise<SubscriptionPlanWithSeats[]> {
  const plans = await readDemoSubscriptionPlans();
  return Promise.all(
    plans.map(async (plan) => ({
      ...plan,
      seats_used: await seatCounter(plan.id),
    }))
  );
}
