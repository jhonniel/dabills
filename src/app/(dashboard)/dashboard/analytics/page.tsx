import {
  CategoryBreakdownChart,
  MonthlyExpenseChart,
} from "@/components/charts/expense-charts";
import { AnimatedCurrency } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDashboardOverview } from "@/features/dashboard/queries";
import { formatMoney } from "@/lib/billing/expenses";

export default async function AnalyticsPage() {
  const overview = await getDashboardOverview();
  const maxCategory = overview.categoryBreakdown[0]?.monthly ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Analytics
        </h1>
        <p className="mt-2 text-muted-foreground">
          Monthly burn, category concentration, and recurring timeline insights.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardDescription>Monthly spend</CardDescription>
            <CardTitle className="font-display text-2xl text-cyan-200">
              <AnimatedCurrency amount={overview.totals.monthly} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardDescription>Yearly projection</CardDescription>
            <CardTitle className="font-display text-2xl">
              <AnimatedCurrency amount={overview.totals.yearly} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardDescription>Tracked services</CardDescription>
            <CardTitle className="font-display text-2xl">
              {overview.totals.totalCount}
            </CardTitle>
          </CardHeader>
        </Card>
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
            <CardTitle className="font-display text-lg">Category concentration</CardTitle>
            <CardDescription>Share of monthly spend by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.categoryBreakdown.map((item) => (
              <div key={item.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="text-muted-foreground">
                    {formatMoney(item.monthly)} ·{" "}
                    {Math.round((item.monthly / overview.totals.monthly) * 100 || 0)}%
                  </span>
                </div>
                <Progress value={(item.monthly / maxCategory) * 100} />
              </div>
            ))}
            {overview.categoryBreakdown.length === 0 && (
              <p className="text-sm text-muted-foreground">No category data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recurring timeline</CardTitle>
            <CardDescription>Upcoming renewals sorted by date</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.upcoming.map((item, index) => (
              <div key={item.id} className="relative pl-6">
                <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-cyan-400" />
                {index < overview.upcoming.length - 1 && (
                  <span className="absolute top-4 left-[4px] h-[calc(100%-4px)] w-px bg-white/10" />
                )}
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.next_billing_date}
                      </p>
                    </div>
                    <p className="font-display text-sm font-semibold">
                      {formatMoney(item.amount, item.currency)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {overview.upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming renewals.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
