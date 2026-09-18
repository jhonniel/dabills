import { Suspense } from "react";

import { BillingCalendar } from "@/components/billing/billing-calendar";
import { BillingToolbar } from "@/components/billing/billing-toolbar";
import { BillsCards, BillsTable } from "@/components/billing/bills-list";
import { BillingTimeline } from "@/components/billing/billing-timeline";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getBillingOverview,
  listBillingCycles,
} from "@/features/billing/queries";
import { formatMoney } from "@/lib/billing/expenses";
import type { BillingFilters } from "@/validators/billing";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function buildMonthOptions() {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i <= 11; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return options;
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: BillingFilters = {
    search: typeof params.search === "string" ? params.search : undefined,
    status:
      typeof params.status === "string"
        ? (params.status as BillingFilters["status"])
        : "all",
    view:
      typeof params.view === "string"
        ? (params.view as BillingFilters["view"])
        : "table",
    month: typeof params.month === "string" ? params.month : undefined,
    horizon: "past",
  };

  const [{ items }, overview] = await Promise.all([
    listBillingCycles(filters),
    getBillingOverview(),
  ]);

  const view = filters.view ?? "table";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Billing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Past bills only — due today or earlier.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pending" value={String(overview.counts.pending)} />
        <StatCard
          title="Overdue"
          value={String(overview.counts.overdue)}
          accent="text-rose-300"
        />
        <StatCard title="Paid" value={String(overview.counts.paid)} />
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Still unpaid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-cyan-200">
              {formatMoney(overview.amountDue)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {overview.counts.pendingVerification} awaiting verification
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-white/5" />}>
        <BillingToolbar monthOptions={buildMonthOptions()} />
      </Suspense>

      {view === "table" && (
        <>
          <div className="md:hidden">
            <BillsCards items={items} />
          </div>
          <div className="hidden md:block">
            <BillsTable items={items} />
          </div>
        </>
      )}
      {view === "cards" && <BillsCards items={items} />}
      {view === "calendar" && (
        <BillingCalendar items={items} initialMonth={filters.month} />
      )}
      {view === "timeline" && <BillingTimeline items={items} />}
    </div>
  );
}
