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
import { listPayments } from "@/features/payments/queries";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InviteCode, Profile } from "@/types";

export async function getAdminOverview() {
  await requireAdmin();

  const [users, invites, payments, subscriptions, bills, logs, emails] =
    await Promise.all([
      readAdminUsers(),
      readAdminInvites(),
      listPayments({ status: "all" }),
      readDemoSubscriptions(),
      readDemoBillingCycles(),
      readActivityLogs(),
      readDemoEmailLogs(),
    ]);

  const pendingPayments = payments.items.filter(
    (p) => p.status === "pending_verification"
  );

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

export async function getAdminAnalytics() {
  await requireAdmin();
  const [users, payments, subscriptions, bills] = await Promise.all([
    readAdminUsers(),
    listPayments({ status: "all" }),
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
