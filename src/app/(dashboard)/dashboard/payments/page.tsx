import { Suspense } from "react";

import { PaymentFiltersBar } from "@/components/payments/payment-filters";
import { PaymentTimeline } from "@/components/payments/payment-timeline";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getPaymentsOverview,
  listPayments,
} from "@/features/payments/queries";
import { formatMoney } from "@/lib/billing/expenses";
import type { PaymentFilters } from "@/validators/payment";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: PaymentFilters = {
    search: typeof params.search === "string" ? params.search : undefined,
    status:
      typeof params.status === "string"
        ? (params.status as PaymentFilters["status"])
        : "all",
  };

  const [{ items }, overview] = await Promise.all([
    listPayments(filters),
    getPaymentsOverview(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Payment history
        </h1>
        <p className="mt-2 text-muted-foreground">
          Timeline of receipts, OCR results, references, and verification status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total payments" value={String(overview.total)} />
        <StatCard
          title="Pending verification"
          value={String(overview.pendingVerification)}
          hint="Awaiting approval"
        />
        <StatCard title="Approved" value={String(overview.approved)} />
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold text-cyan-200">
              {formatMoney(overview.totalPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/5" />}>
        <PaymentFiltersBar />
      </Suspense>

      <PaymentTimeline items={items} />
    </div>
  );
}
