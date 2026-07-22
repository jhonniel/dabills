import Link from "next/link";
import { Plus } from "lucide-react";

import {
  CategoryBreakdownChart,
  MonthlyExpenseChart,
} from "@/components/charts/expense-charts";
import { AnimatedCurrency, StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/subscriptions/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardOverview } from "@/features/dashboard/queries";
import { formatMoney } from "@/lib/billing/expenses";

export default async function DashboardPage() {
  const overview = await getDashboardOverview();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Overview
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your recurring spend at a glance — monthly cost, renewals, and category mix.
          </p>
        </div>
        <Button
          asChild
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
        >
          <Link href="/dashboard/subscriptions/new">
            <Plus className="size-4" />
            Add subscription
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total monthly cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tracking-tight text-cyan-200">
              <AnimatedCurrency amount={overview.totals.monthly} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {overview.totals.activeCount} active subscriptions
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total yearly cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold tracking-tight">
              <AnimatedCurrency amount={overview.totals.yearly} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Projected annual burn</p>
          </CardContent>
        </Card>
        <StatCard
          title="Active subscriptions"
          value={String(overview.totals.activeCount)}
          hint={`${overview.totals.pausedCount} paused · ${overview.totals.cancelledCount} cancelled`}
        />
        <StatCard
          title="Bills due soon"
          value={String(overview.upcoming.length)}
          hint="Next renewals in your queue"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <MonthlyExpenseChart data={overview.monthlySeries} />
        </div>
        <div className="xl:col-span-2">
          <CategoryBreakdownChart data={overview.categoryBreakdown} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-lg">Upcoming bills</CardTitle>
            <CardDescription>Next renewals across active subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming renewals.</p>
            )}
            {overview.upcoming.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/subscriptions/${item.id}`}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 transition hover:border-cyan-400/20"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.next_billing_date} · {item.category?.name ?? "Others"}
                  </p>
                </div>
                <p className="font-display text-sm font-semibold">
                  {formatMoney(item.amount, item.currency)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent activity</CardTitle>
            <CardDescription>Latest subscription updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.recent.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
