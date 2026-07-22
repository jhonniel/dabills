import Link from "next/link";

import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategories } from "@/features/categories/queries";

export default async function NewSubscriptionPage() {
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/subscriptions"
          className="text-sm text-muted-foreground hover:text-cyan-300"
        >
          ← Back to subscriptions
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Add subscription
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track a new recurring bill with category, cadence, and reminders.
        </p>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Subscription details</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
