import { listAllPaymentsForAdmin } from "@/features/payments/queries";
import { AdminPaymentsQueue } from "@/components/admin/payments-queue";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function AdminPaymentsPage() {
  const { items } = await listAllPaymentsForAdmin({ status: "all" });
  const pending = items.filter((item) => item.status === "pending_verification");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Payment approvals
        </h1>
        <p className="mt-2 text-muted-foreground">
          Matching amount and transfer reference auto-confirm. Review the rest
          here.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Needs review" value={String(pending.length)} />
        <StatCard
          title="Approved"
          value={String(items.filter((i) => i.status === "approved").length)}
        />
        <StatCard
          title="Rejected"
          value={String(items.filter((i) => i.status === "rejected").length)}
        />
      </div>

      <AdminPaymentsQueue
        items={[
          ...pending,
          ...items.filter((i) => i.status !== "pending_verification"),
        ]}
      />
    </div>
  );
}
