import Link from "next/link";
import {
  CalendarClock,
  CreditCard,
  Receipt,
  Wallet,
} from "lucide-react";

import {
  CategoryBreakdownChart,
  MonthlyExpenseChart,
} from "@/components/charts/lazy-expense-charts";
import { EmptyState } from "@/components/dashboard/empty-state";
import { MetricCard } from "@/components/dashboard/metric-card";
import { AnimatedCurrency } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/subscriptions/status-badge";
import { Button } from "@/components/ui/button";
import { getDashboardOverview } from "@/features/dashboard/queries";
import { formatMoney } from "@/lib/billing/expenses";

export default async function DashboardPage() {
  const overview = await getDashboardOverview();
  const hasSubs = overview.totals.activeCount > 0 || overview.recent.length > 0;
  const nextBill = overview.upcoming[0] ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.14em] text-cyan-400/80 uppercase">
            Dashboard
          </p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-white">
            Overview
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
            Monthly spend, upcoming renewals, and category mix — in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            asChild
            variant="outline"
            className="h-10 rounded-xl border-white/10 bg-transparent"
          >
            <Link href="/dashboard/billing">View billing</Link>
          </Button>
          <Button
            asChild
            className="h-10 rounded-xl bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
          >
            <Link href="/dashboard/subscriptions">Subscriptions</Link>
          </Button>
        </div>
      </div>

      {!hasSubs && (
        <EmptyState
          icon={CreditCard}
          title="No subscriptions yet"
          description="Your admin assigns plans and seats. Once you’re added to a plan, spend and renewals will show up here."
          action={{ href: "/dashboard/billing", label: "Open billing" }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Monthly cost"
          value={<AnimatedCurrency amount={overview.totals.monthly} />}
          hint={`${overview.totals.activeCount} active subscription${overview.totals.activeCount === 1 ? "" : "s"}`}
          icon={Wallet}
          accent
        />
        <MetricCard
          label="Next bill"
          value={
            <AnimatedCurrency amount={nextBill ? Number(nextBill.amount) : 0} />
          }
          hint={
            nextBill
              ? `${nextBill.name} · ${nextBill.next_billing_date}`
              : "No renewals queued"
          }
          icon={Receipt}
        />
        <MetricCard
          label="Active plans"
          value={String(overview.totals.activeCount)}
          hint={`${overview.totals.pausedCount} paused · ${overview.totals.cancelledCount} cancelled`}
          icon={CreditCard}
        />
        <MetricCard
          label="Due soon"
          value={String(overview.upcoming.length)}
          hint="Upcoming renewals in your queue"
          icon={CalendarClock}
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
        <section className="rounded-2xl border border-white/10 bg-[#0c121c]/80">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Upcoming bills
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Next renewals across active plans
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-cyan-300 hover:text-cyan-200"
            >
              <Link href="/dashboard/billing">See all</Link>
            </Button>
          </div>
          <div className="p-3">
            {overview.upcoming.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="Nothing due yet"
                description="When renewals are scheduled, they’ll appear in this list."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="space-y-1">
                {overview.upcoming.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/dashboard/subscriptions/${item.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">
                          {item.name}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {item.next_billing_date} ·{" "}
                          {item.category?.name ?? "Others"}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-sm font-semibold tabular-nums text-zinc-100">
                        {formatMoney(item.amount, item.currency)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0c121c]/80">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-white">
                Recent activity
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Latest subscription updates
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-cyan-300 hover:text-cyan-200"
            >
              <Link href="/dashboard/subscriptions">Manage</Link>
            </Button>
          </div>
          <div className="p-3">
            {overview.recent.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title="No activity yet"
                description="Assigned plans and status changes will show up here."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              <ul className="space-y-1">
                {overview.recent.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {item.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        Updated{" "}
                        {new Date(item.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
