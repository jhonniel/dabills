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
import { createAdminClient } from "@/lib/supabase/admin";
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
  AdminExpense,
  InviteCode,
  Profile,
  Subscription,
  SubscriptionPlan,
  SubscriptionPlanWithSeats,
} from "@/types";

async function countDemoSeats(planId: string) {
  const subs = await readDemoSubscriptions();
  return subs.filter(
    (s) =>
      s.plan_id === planId &&
      (s.status === "active" || s.status === "paused")
  ).length;
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

export async function listSubscriptionPlans(): Promise<{
  items: SubscriptionPlanWithSeats[];
  isDemo: boolean;
}> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await listDemoPlansWithSeats(), isDemo: true };
  }

  try {
    const admin = createAdminClient();
    const { data: plans, error } = await admin
      .from("subscription_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !plans) {
      return { items: await listDemoPlansWithSeats(), isDemo: true };
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
  } catch {
    return { items: await listDemoPlansWithSeats(), isDemo: true };
  }
}

export async function getAdminOverview() {
  await requireAdmin();

  const [users, invites, payments, subscriptions, bills, logs, emails, expenses] =
    await Promise.all([
      readAdminUsers(),
      readAdminInvites(),
      listAllPaymentsForAdmin({ status: "all" }),
      readDemoSubscriptions(),
      readDemoBillingCycles(),
      readActivityLogs(),
      readDemoEmailLogs(),
      listAdminExpenses(),
    ]);

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
    activeUsers: users.filter((u) => u.status !== "disabled").length,
    invitesActive: invites.filter((i) => i.is_active).length,
    subscriptionsCount: subscriptions.length,
    billsCount: bills.length,
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
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return { items: await readAdminUsers(), isDemo: true as const };
    }

    return {
      items: (data as Profile[]).map((profile) => ({
        ...profile,
        subscriptions_count: 0,
        status: "active" as const,
      })),
      isDemo: false as const,
    };
  } catch {
    return { items: await readAdminUsers(), isDemo: true as const };
  }
}

export async function listAdminInvites() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { items: await readAdminInvites(), isDemo: true as const };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("invite_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return { items: await readAdminInvites(), isDemo: true as const };
    }

    return { items: data as InviteCode[], isDemo: false as const };
  } catch {
    return { items: await readAdminInvites(), isDemo: true as const };
  }
}

export async function listAdminCategories() {
  await requireAdmin();
  return { items: await readAdminCategories(), isDemo: true as const };
}

export async function listAdminActivity() {
  await requireAdmin();
  return { items: await readActivityLogs(), isDemo: true as const };
}

export async function listAdminEmails() {
  await requireAdmin();
  return { items: await readDemoEmailLogs(), isDemo: true as const };
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
    const admin = createAdminClient();
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
  const [users, payments, subscriptions, bills] = await Promise.all([
    readAdminUsers(),
    listAllPaymentsForAdmin({ status: "all" }),
    readDemoSubscriptions(),
    readDemoBillingCycles(),
  ]);

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
