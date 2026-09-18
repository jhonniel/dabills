import Link from "next/link";

import { AdminSubscriptionPlansPanel } from "@/components/admin/subscription-plans-panel";
import { listSubscriptionPlans } from "@/features/admin/queries";
import { listCategories } from "@/features/categories/queries";

export default async function AdminSubscriptionPlansPage() {
  const [{ items: plans }, categories] = await Promise.all([
    listSubscriptionPlans(),
    listCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/subscriptions/assign"
          className="text-sm text-zinc-500 hover:text-cyan-300"
        >
          Assign seats →
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Subscription plans
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Create and edit shared plans, then assign users into seats.
        </p>
      </div>

      <AdminSubscriptionPlansPanel plans={plans} categories={categories} />
    </div>
  );
}
