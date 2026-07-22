import Link from "next/link";
import { notFound } from "next/navigation";

import { SettleBillForm } from "@/components/payments/settle-bill-form";
import { getBillingCycle } from "@/features/billing/get-cycle";

export default async function SettleBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { item } = await getBillingCycle(id);

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/billing"
          className="text-sm text-muted-foreground hover:text-cyan-300"
        >
          ← Back to billing
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Settle bill
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload a receipt. OCR extracts amount, merchant, date, and reference,
          then validates against this bill.
        </p>
      </div>

      <SettleBillForm bill={item} />
    </div>
  );
}
