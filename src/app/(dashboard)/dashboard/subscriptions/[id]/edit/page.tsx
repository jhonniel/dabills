import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategories } from "@/features/categories/queries";
import { getSubscription } from "@/features/subscriptions/queries";

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ item }, categories] = await Promise.all([
    getSubscription(id),
    listCategories(),
  ]);

  if (!item) notFound();
  if (item.plan_id) {
    redirect(`/dashboard/subscriptions/${item.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/dashboard/subscriptions/${item.id}`}
          className="text-sm text-muted-foreground hover:text-cyan-300"
        >
          ← Back to {item.name}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Edit subscription
        </h1>
        <p className="mt-2 text-muted-foreground">
          Update billing details, status, and reminder preferences.
        </p>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <SubscriptionForm categories={categories} subscription={item} />
        </CardContent>
      </Card>
    </div>
  );
}
