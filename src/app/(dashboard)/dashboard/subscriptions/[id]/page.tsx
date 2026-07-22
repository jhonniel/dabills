import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { StatusBadge } from "@/components/subscriptions/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSubscription } from "@/features/subscriptions/queries";
import { formatMoney, toMonthlyAmount, toYearlyAmount } from "@/lib/billing/expenses";
import { DeleteSubscriptionButton } from "@/components/subscriptions/delete-button";

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { item } = await getSubscription(id);

  if (!item) notFound();

  const monthly = toMonthlyAmount(
    item.amount,
    item.billing_frequency,
    item.custom_interval_days
  );
  const yearly = toYearlyAmount(
    item.amount,
    item.billing_frequency,
    item.custom_interval_days
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/subscriptions"
            className="text-sm text-muted-foreground hover:text-cyan-300"
          >
            ← Back to subscriptions
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {item.name}
            </h1>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-muted-foreground">
            {item.category?.name ?? "Uncategorized"} ·{" "}
            <span className="capitalize">
              {item.billing_frequency.replace("_", " ")}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/dashboard/subscriptions/${item.id}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <DeleteSubscriptionButton id={item.id} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardDescription>Billed amount</CardDescription>
            <CardTitle className="font-display text-2xl">
              {formatMoney(item.amount, item.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardDescription>Monthly equivalent</CardDescription>
            <CardTitle className="font-display text-2xl text-cyan-200">
              {formatMoney(monthly, item.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardDescription>Yearly equivalent</CardDescription>
            <CardTitle className="font-display text-2xl">
              {formatMoney(yearly, item.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {[
            ["Start date", item.start_date],
            ["Renewal date", item.renewal_date],
            ["Next billing", item.next_billing_date],
            ["Auto renewal", item.auto_renewal ? "Enabled" : "Disabled"],
            ["Reminders", `${item.reminder_days.join(", ")} days before`],
            ["Currency", item.currency],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-sm font-medium">{value}</p>
            </div>
          ))}
          {item.notes && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{item.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
