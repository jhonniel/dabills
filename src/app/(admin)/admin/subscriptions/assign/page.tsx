import Link from "next/link";

import { AdminAssignSubscriptionForm } from "@/components/admin/assign-subscription-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listAdminUsers,
  listAssignedSubscriptions,
  listSubscriptionPlans,
} from "@/features/admin/queries";

export default async function AdminAssignSubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultUserId =
    typeof params.userId === "string" ? params.userId : undefined;
  const defaultPlanId =
    typeof params.planId === "string" ? params.planId : undefined;

  const [{ items: users }, { items: plans }, assigned] = await Promise.all([
    listAdminUsers(),
    listSubscriptionPlans(),
    listAssignedSubscriptions(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/subscriptions/plans"
          className="text-sm text-muted-foreground hover:text-cyan-300"
        >
          ← Back to plans
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Assign subscriptions
        </h1>
        <p className="mt-2 text-muted-foreground">
          A user can hold many subscriptions. Assign each plan separately. The
          same plan cannot be assigned twice. Users can view what you assign;
          they cannot add or change it.
        </p>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Plan & user</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminAssignSubscriptionForm
            users={users}
            plans={plans}
            assigned={assigned}
            defaultUserId={defaultUserId}
            defaultPlanId={defaultPlanId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
