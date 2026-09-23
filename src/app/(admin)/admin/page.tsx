import Link from "next/link";

import { SalesExpensesChart } from "@/components/charts/lazy-expense-charts";
import { getAdminOverview } from "@/features/admin/queries";
import { formatMoney } from "@/lib/billing/expenses";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const monthLabel = new Date().toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Admin overview
          </h1>
          <p className="mt-2 text-muted-foreground">
            Users, invites, payment approvals, and platform health at a glance.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-xl">
            <Link href="/admin/invites">Generate invite</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/admin/payments">Review payments</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sales this month"
          value={formatMoney(overview.salesThisMonth)}
          hint={monthLabel}
          accent="text-teal-200"
        />
        <StatCard
          title="Expenses this month"
          value={formatMoney(overview.expensesThisMonth)}
          hint="Platform / ops costs"
          accent="text-rose-200"
        />
        <StatCard
          title="Net this month"
          value={formatMoney(overview.netThisMonth)}
          hint="Sales − expenses"
          accent={
            overview.netThisMonth >= 0 ? "text-cyan-200" : "text-amber-200"
          }
        />
        <StatCard
          title="Pending approvals"
          value={String(overview.pendingApprovals)}
          accent="text-amber-200"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Users"
          value={String(overview.usersCount)}
          hint={`${overview.activeUsers} active`}
        />
        <StatCard
          title="Active invites"
          value={String(overview.invitesActive)}
        />
        <StatCard
          title="Approved volume"
          value={formatMoney(overview.approvedVolume)}
          hint="All-time approved payments"
          accent="text-cyan-200"
        />
        <StatCard
          title="Subscriptions"
          value={String(overview.subscriptionsCount)}
        />
      </div>

      <SalesExpensesChart data={overview.financeSeries} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-lg">Pending payments</CardTitle>
            <CardDescription>Awaiting admin verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.pendingPayments.length === 0 && (
              <p className="text-sm text-muted-foreground">No payments waiting.</p>
            )}
            {overview.pendingPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {payment.subscription_name ?? "Payment"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatMoney(payment.amount, payment.currency)} ·{" "}
                    {payment.reference_number ?? "No ref"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-amber-400/30 bg-amber-400/10 text-amber-200"
                >
                  Pending
                </Badge>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link href="/admin/payments">Open payments queue</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
            <CardDescription>Audit trail of admin actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.recentActivity.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <p className="text-sm font-medium">{log.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                  {log.entity_type ? ` · ${log.entity_type}` : ""}
                </p>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link href="/admin/logs">View all logs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
