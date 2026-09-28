import { requireAdmin } from "@/lib/admin/guard";
import {
  readActivityLogs,
  readAdminCategories,
  readAdminInvites,
  readAdminUsers,
} from "@/lib/admin/demo-store";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import { readDemoBillingCycles } from "@/lib/billing/demo-bills";
import { readDemoEmailLogs } from "@/lib/notifications/demo-store";
import { listAllPaymentsForAdmin } from "@/features/payments/queries";
import { isSupabaseConfigured } from "@/lib/env";
import { tryCreateAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readDemoSubscriptionPlans } from "@/lib/subscriptions/plans-store";
import { readDemoAdminExpenses } from "@/lib/expenses/expenses-store";
import {
  buildMonthlyAdminExpenseSeries,
  buildMonthlySalesSeries,
  mergeFinanceSeries,
  sumExpensesInCurrentMonth,
  sumSalesInCurrentMonth,
} from "@/lib/admin/finance-series";
import type {
  ActivityLog,
  AdminExpense,
  Category,
  EmailLog,
  InviteCode,
  Profile,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanWithSeats,
} from "@/types";

/**
 * Prefer service-role for admin reads; fall back to the signed-in admin
 * session (RLS allows is_admin() to read all profiles / related rows).
 */
async function getAdminDataClient() {
  return tryCreateAdminClient() ?? (await createClient());
}

async function listDemoPlansWithSeats() {
  const [plans, subs] = await Promise.all([
    readDemoSubscriptionPlans(),
    readDemoSubscriptions(),
  ]);
  const counts = new Map<string, number>();
  for (const sub of subs) {
    if (
      !sub.plan_id ||
      (sub.status !== "active" && sub.status !== "paused")
    ) {
      continue;
    }
    counts.set(sub.plan_id, (counts.get(sub.plan_id) ?? 0) + 1);
  }
  return plans.map((plan) => ({
    ...plan,
    seats_used: counts.get(plan.id) ?? 0,
  }));
}

type SubWithCategory = Subscription & {
  category?: { name?: string | null } | null;
};

async function listLiveSubscriptions() {
  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("subscriptions")
      .select("*, category:categories(id, slug, name, icon, color)")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("listLiveSubscriptions", error.message);
      return [] as SubWithCategory[];
    }
    return (data ?? []) as SubWithCategory[];
  } catch (error) {
    console.warn("listLiveSubscriptions", error);
    return [] as SubWithCategory[];
  }
}

async function listLiveBillingCycles() {
  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("billing_cycles")
      .select("id, status")
      .order("due_date", { ascending: false });
    if (error) {
      console.warn("listLiveBillingCycles", error.message);
      return [] as { id: string; status: string }[];
    }
    return (data ?? []) as { id: string; status: string }[];
  } catch (error) {
    console.warn("listLiveBillingCycles", error);
    return [] as { id: string; status: string }[];
  }
}

export async function listSubscriptionPlans(): Promise<{
  items: SubscriptionPlanWithSeats[];
  isDemo: boolean;
}> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await listDemoPlansWithSeats(), isDemo: true };
  }

  try {
    const admin = await getAdminDataClient();
    const { data: plans, error } = await admin
      .from("subscription_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !plans) {
      console.warn("listSubscriptionPlans", error?.message);
      return { items: [], isDemo: false };
    }

    const planRows = plans as SubscriptionPlan[];
    if (planRows.length === 0) {
      return { items: [], isDemo: false };
    }

    const { data: seats } = await admin
      .from("subscriptions")
      .select("plan_id, status")
      .in(
        "plan_id",
        planRows.map((p) => p.id)
      )
      .in("status", ["active", "paused"]);

    const counts = new Map<string, number>();
    for (const row of (seats ?? []) as Pick<Subscription, "plan_id" | "status">[]) {
      if (!row.plan_id) continue;
      counts.set(row.plan_id, (counts.get(row.plan_id) ?? 0) + 1);
    }

    return {
      items: planRows.map((plan) => ({
        ...plan,
        seats_used: counts.get(plan.id) ?? 0,
      })),
      isDemo: false,
    };
  } catch (error) {
    console.warn("listSubscriptionPlans", error);
    return { items: [], isDemo: false };
  }
}

export async function getAdminOverview() {
  await requireAdmin();

  const [usersRes, invitesRes, payments, expenses, activityRes, emailsRes] =
    await Promise.all([
      listAdminUsers(),
      listAdminInvites(),
      listAllPaymentsForAdmin({ status: "all" }),
      listAdminExpenses(),
      listAdminActivity(),
      listAdminEmails(),
    ]);

  const users = usersRes.items;
  const invites = invitesRes.items;
  const logs = activityRes.items;
  const emails = emailsRes.items;

  let subscriptionsCount = 0;
  let billsCount = 0;

  if (!isSupabaseConfigured() || usersRes.isDemo) {
    const [subs, bills] = await Promise.all([
      readDemoSubscriptions(),
      readDemoBillingCycles(),
    ]);
    subscriptionsCount = subs.length;
    billsCount = bills.length;
  } else {
    const [subs, bills] = await Promise.all([
      listLiveSubscriptions(),
      listLiveBillingCycles(),
    ]);
    subscriptionsCount = subs.length;
    billsCount = bills.length;
  }

  const pendingPayments = payments.items.filter(
    (p) => p.status === "pending_verification"
  );

  const salesSeries = buildMonthlySalesSeries(payments.items, 6);
  const expenseSeries = buildMonthlyAdminExpenseSeries(expenses.items, 6);
  const financeSeries = mergeFinanceSeries(salesSeries, expenseSeries);
  const salesThisMonth = sumSalesInCurrentMonth(payments.items);
  const expensesThisMonth = sumExpensesInCurrentMonth(expenses.items);

  return {
    usersCount: users.length,
    activeUsers: users.filter(
      (u) => (u.account_status ?? u.status) !== "disabled"
    ).length,
    invitesActive: invites.filter((i) => i.is_active).length,
    subscriptionsCount,
    billsCount,
    pendingApprovals: pendingPayments.length,
    approvedVolume: payments.items
      .filter((p) => p.status === "approved")
      .reduce((sum, p) => sum + Number(p.amount), 0),
    salesThisMonth,
    expensesThisMonth,
    netThisMonth: salesThisMonth - expensesThisMonth,
    financeSeries,
    recentActivity: logs.slice(0, 8),
    emailsSent: emails.filter((e) => e.status === "sent").length,
    pendingPayments: pendingPayments.slice(0, 5),
  };
}

export async function listAdminUsers() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await readAdminUsers(), isDemo: true as const };
  }

  try {
    const admin = await getAdminDataClient();
    const profileColumns =
      "id, email, full_name, code_name, avatar_url, role, account_status, plan_id, timezone, notification_email, notification_in_app, created_at, updated_at";
    let { data, error } = await admin
      .from("profiles")
      .select(profileColumns)
      .order("created_at", { ascending: false });

    if (error && /code_name|account_status|schema cache/i.test(error.message)) {
      const fallback = await admin
        .from("profiles")
        .select(
          "id, email, full_name, avatar_url, role, timezone, notification_email, notification_in_app, created_at, updated_at"
        )
        .order("created_at", { ascending: false });
      data = fallback.data as typeof data;
      error = fallback.error;
    }

    if (error) {
      console.warn("listAdminUsers", error.message);
      return { items: [], isDemo: false as const };
    }

    if (!data) {
      return { items: [], isDemo: false as const };
    }

    const { data: seats } = await admin
      .from("subscriptions")
      .select("user_id")
      .neq("status", "cancelled");

    const seatCounts = new Map<string, number>();
    for (const row of seats ?? []) {
      const uid = (row as { user_id: string }).user_id;
      seatCounts.set(uid, (seatCounts.get(uid) ?? 0) + 1);
    }

    return {
      items: (data as Profile[]).map((profile) => {
        const account_status = profile.account_status ?? "active";
        return {
          ...profile,
          code_name: profile.code_name ?? null,
          account_status,
          subscriptions_count: seatCounts.get(profile.id) ?? 0,
          status: account_status,
          activation_token: null,
        };
      }),
      isDemo: false as const,
    };
  } catch (error) {
    console.warn("listAdminUsers", error);
    return { items: [], isDemo: false as const };
  }
}

export async function listAdminInvites() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await readAdminInvites(), isDemo: true as const };
  }

  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("listAdminInvites", error?.message);
      return { items: [], isDemo: false as const };
    }

    return { items: data as InviteCode[], isDemo: false as const };
  } catch (error) {
    console.warn("listAdminInvites", error);
    return { items: [], isDemo: false as const };
  }
}

export async function listAdminCategories() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await readAdminCategories(), isDemo: true as const };
  }

  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.warn("listAdminCategories", error.message);
      return { items: [], isDemo: false as const };
    }

    return { items: (data ?? []) as Category[], isDemo: false as const };
  } catch (error) {
    console.warn("listAdminCategories", error);
    return { items: [], isDemo: false as const };
  }
}

export async function listAdminActivity() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await readActivityLogs(), isDemo: true as const };
  }

  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("listAdminActivity", error.message);
      return { items: [], isDemo: false as const };
    }

    return { items: (data ?? []) as ActivityLog[], isDemo: false as const };
  } catch (error) {
    console.warn("listAdminActivity", error);
    return { items: [], isDemo: false as const };
  }
}

export async function listAdminEmails() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await readDemoEmailLogs(), isDemo: true as const };
  }

  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("email_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.warn("listAdminEmails", error.message);
      return { items: [], isDemo: false as const };
    }

    return { items: (data ?? []) as EmailLog[], isDemo: false as const };
  } catch (error) {
    console.warn("listAdminEmails", error);
    return { items: [], isDemo: false as const };
  }
}

export async function listAdminExpenses(): Promise<{
  items: AdminExpense[];
  isDemo: boolean;
}> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await readDemoAdminExpenses(), isDemo: true };
  }

  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("admin_expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (error) {
      console.warn("listAdminExpenses", error.message);
      return { items: [], isDemo: false };
    }

    return { items: (data ?? []) as AdminExpense[], isDemo: false };
  } catch (error) {
    console.warn("listAdminExpenses", error);
    return { items: [], isDemo: false };
  }
}

export async function getAdminAnalytics() {
  await requireAdmin();

  const [usersRes, payments] = await Promise.all([
    listAdminUsers(),
    listAllPaymentsForAdmin({ status: "all" }),
  ]);

  const users = usersRes.items;

  let subscriptions: SubWithCategory[] = [];
  let bills: { id: string; status: string }[] = [];

  if (!isSupabaseConfigured() || usersRes.isDemo) {
    subscriptions = await readDemoSubscriptions();
    bills = await readDemoBillingCycles();
  } else {
    [subscriptions, bills] = await Promise.all([
      listLiveSubscriptions(),
      listLiveBillingCycles(),
    ]);
  }

  const byStatus = {
    pending: payments.items.filter((p) => p.status === "pending").length,
    pending_verification: payments.items.filter(
      (p) => p.status === "pending_verification"
    ).length,
    approved: payments.items.filter((p) => p.status === "approved").length,
    rejected: payments.items.filter((p) => p.status === "rejected").length,
  };

  const billStatus = {
    upcoming: bills.filter((b) => b.status === "upcoming").length,
    pending: bills.filter((b) => b.status === "pending").length,
    overdue: bills.filter((b) => b.status === "overdue").length,
    paid: bills.filter((b) => b.status === "paid").length,
  };

  const categorySpend = new Map<string, number>();
  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;
    const key = sub.category?.name ?? "Others";
    categorySpend.set(key, (categorySpend.get(key) ?? 0) + Number(sub.amount));
  }

  return {
    users: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    subscriptions: subscriptions.length,
    payments: payments.items.length,
    byStatus,
    billStatus,
    categoryBreakdown: Array.from(categorySpend.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total),
  };
}

export type AssignedSubscription = {
  id: string;
  user_id: string;
  name: string;
  status: string;
  plan_id: string | null;
  start_date: string;
  next_billing_date: string;
  amount: number;
  currency: string;
};

/** Every subscription seat, so an admin can assign more plans to the same user. */
export async function listAssignedSubscriptions(): Promise<AssignedSubscription[]> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    const subs = await readDemoSubscriptions();
    return subs.map((sub) => ({
      id: sub.id,
      user_id: sub.user_id,
      name: sub.name,
      status: sub.status,
      plan_id: sub.plan_id ?? null,
      start_date: sub.start_date,
      next_billing_date: sub.next_billing_date,
      amount: Number(sub.amount),
      currency: sub.currency,
    }));
  }

  try {
    const admin = await getAdminDataClient();
    const { data, error } = await admin
      .from("subscriptions")
      .select(
        "id, user_id, name, status, plan_id, start_date, next_billing_date, amount, currency"
      )
      .order("name", { ascending: true });

    if (error) {
      console.warn("listAssignedSubscriptions", error.message);
      return [];
    }

    return (data ?? []) as AssignedSubscription[];
  } catch (error) {
    console.warn("listAssignedSubscriptions", error);
    return [];
  }
}
