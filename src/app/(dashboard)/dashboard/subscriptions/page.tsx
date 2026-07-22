import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";

import { SubscriptionFiltersBar } from "@/components/subscriptions/subscription-filters";
import { SubscriptionsTable } from "@/components/subscriptions/subscriptions-table";
import { Button } from "@/components/ui/button";
import { listCategories } from "@/features/categories/queries";
import { listSubscriptions } from "@/features/subscriptions/queries";
import type { SubscriptionFilters } from "@/validators/subscription";

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: SubscriptionFilters = {
    search: typeof params.search === "string" ? params.search : undefined,
    status:
      typeof params.status === "string"
        ? (params.status as SubscriptionFilters["status"])
        : "all",
    categoryId:
      typeof params.categoryId === "string" ? params.categoryId : undefined,
    sort:
      typeof params.sort === "string"
        ? (params.sort as SubscriptionFilters["sort"])
        : "created_desc",
  };

  const [{ items }, categories] = await Promise.all([
    listSubscriptions(filters),
    listCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Subscriptions
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage every recurring service — search, filter, and keep renewals in view.
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

      <Suspense fallback={<div className="h-10 animate-pulse rounded-xl bg-white/5" />}>
        <SubscriptionFiltersBar categories={categories} />
      </Suspense>

      <SubscriptionsTable items={items} />
    </div>
  );
}
