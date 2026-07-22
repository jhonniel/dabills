import { getAdminAnalytics } from "@/features/admin/queries";
import { formatMoney } from "@/lib/billing/expenses";
import { StatCard } from "@/components/dashboard/stat-card";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();
  const maxCategory = analytics.categoryBreakdown[0]?.total ?? 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Analytics
        </h1>
        <p className="mt-2 text-muted-foreground">
          Platform-wide usage, payment funnel, and category concentration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Users" value={String(analytics.users)} />
        <StatCard title="Admins" value={String(analytics.admins)} />
        <StatCard
          title="Subscriptions"
          value={String(analytics.subscriptions)}
        />
        <StatCard title="Payments" value={String(analytics.payments)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-lg">Payment funnel</CardTitle>
            <CardDescription>Status distribution across all payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
              >
                <span className="capitalize">{status.replaceAll("_", " ")}</span>
                <span className="font-display font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="font-display text-lg">Bill statuses</CardTitle>
            <CardDescription>Recurring billing cycle health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.billStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm"
              >
                <span className="capitalize">{status}</span>
                <span className="font-display font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Category spend</CardTitle>
          <CardDescription>Active subscription amounts by category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.categoryBreakdown.map((item) => (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <span className="text-muted-foreground">
                  {formatMoney(item.total)}
                </span>
              </div>
              <Progress value={(item.total / maxCategory) * 100} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
