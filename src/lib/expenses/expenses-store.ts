import { cookies } from "next/headers";

import { getNextBillingDate } from "@/lib/billing/expenses";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import type { AdminExpense } from "@/types";
import type { AdminExpenseInput } from "@/validators/expense";

const EXPENSES_COOKIE = "dabills_demo_admin_expenses_v2";
const LEGACY_EXPENSES_COOKIES = [
  "dabills_demo_admin_expenses_v1",
  "dabills_demo_admin_expenses_v2",
] as const;

export function isExpenseUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/** Drop demo expense cookies so stale seed ids never mix with Supabase. */
export async function clearDemoExpenseCookies() {
  const store = await cookies();
  for (const name of LEGACY_EXPENSES_COOKIES) {
    if (store.get(name)) store.delete(name);
  }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function seedExpenses(): AdminExpense[] {
  const now = new Date().toISOString();
  const today = todayIso();
  return [
    {
      id: "a1b2c3d4-e5f6-4a10-8b11-000000000001",
      name: "Vercel Pro",
      category_id: null,
      amount: 1149,
      currency: DEFAULT_CURRENCY,
      is_recurring: true,
      billing_frequency: "monthly",
      custom_interval_days: null,
      expense_date: "2026-01-01",
      next_recurrence_date: getNextBillingDate(today, "monthly"),
      status: "active",
      notes: "Hosting · recurring ops cost",
      created_by: "demo-admin",
      created_at: now,
      updated_at: now,
    },
    {
      id: "a1b2c3d4-e5f6-4a10-8b11-000000000002",
      name: "Domain renewal",
      category_id: null,
      amount: 899,
      currency: DEFAULT_CURRENCY,
      is_recurring: true,
      billing_frequency: "yearly",
      custom_interval_days: null,
      expense_date: "2026-03-15",
      next_recurrence_date: "2027-03-15",
      status: "active",
      notes: "dabills.app annual renewal",
      created_by: "demo-admin",
      created_at: now,
      updated_at: now,
    },
    {
      id: "a1b2c3d4-e5f6-4a10-8b11-000000000003",
      name: "Business permit filing",
      category_id: null,
      amount: 2500,
      currency: DEFAULT_CURRENCY,
      is_recurring: false,
      billing_frequency: null,
      custom_interval_days: null,
      expense_date: "2026-08-01",
      next_recurrence_date: null,
      status: "active",
      notes: "One-time filing fee",
      created_by: "demo-admin",
      created_at: now,
      updated_at: now,
    },
  ];
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

export function resolveNextRecurrenceDate(input: AdminExpenseInput): string | null {
  if (!input.isRecurring || !input.billingFrequency) return null;
  if (input.nextRecurrenceDate) return input.nextRecurrenceDate;
  return getNextBillingDate(
    input.expenseDate,
    input.billingFrequency,
    input.customIntervalDays
  );
}

export async function readDemoAdminExpenses() {
  return readJsonCookie(EXPENSES_COOKIE, seedExpenses());
}

export async function writeDemoAdminExpenses(items: AdminExpense[]) {
  await writeJsonCookie(EXPENSES_COOKIE, items);
}

export async function createDemoAdminExpense(
  input: AdminExpenseInput,
  createdBy: string | null
) {
  const items = await readDemoAdminExpenses();
  const now = new Date().toISOString();
  const created: AdminExpense = {
    id: crypto.randomUUID(),
    name: input.name,
    category_id: input.categoryId ?? null,
    amount: input.amount,
    currency: input.currency || DEFAULT_CURRENCY,
    is_recurring: input.isRecurring,
    billing_frequency: input.isRecurring ? input.billingFrequency ?? null : null,
    custom_interval_days: input.isRecurring
      ? input.customIntervalDays ?? null
      : null,
    expense_date: input.expenseDate,
    next_recurrence_date: resolveNextRecurrenceDate(input),
    status: input.status ?? "active",
    notes: input.notes ?? null,
    created_by: createdBy,
    created_at: now,
    updated_at: now,
  };
  await writeDemoAdminExpenses([created, ...items]);
  return created;
}

export async function updateDemoAdminExpense(
  id: string,
  input: AdminExpenseInput
) {
  const items = await readDemoAdminExpenses();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;

  const current = items[index];
  const updated: AdminExpense = {
    ...current,
    name: input.name,
    category_id: input.categoryId ?? null,
    amount: input.amount,
    currency: input.currency || current.currency,
    is_recurring: input.isRecurring,
    billing_frequency: input.isRecurring ? input.billingFrequency ?? null : null,
    custom_interval_days: input.isRecurring
      ? input.customIntervalDays ?? null
      : null,
    expense_date: input.expenseDate,
    next_recurrence_date: resolveNextRecurrenceDate(input),
    status: input.status ?? current.status,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString(),
  };

  const next = [...items];
  next[index] = updated;
  await writeDemoAdminExpenses(next);
  return updated;
}

export async function archiveDemoAdminExpense(id: string) {
  const items = await readDemoAdminExpenses();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const next = [...items];
  next[index] = {
    ...next[index],
    status: "archived",
    updated_at: new Date().toISOString(),
  };
  await writeDemoAdminExpenses(next);
  return next[index];
}
