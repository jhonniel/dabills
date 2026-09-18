import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentInstructions } from "@/components/payments/payment-instructions";
import { SettleBillForm } from "@/components/payments/settle-bill-form";
import { getBillingCycle } from "@/features/billing/get-cycle";
import { listActivePaymentMethods } from "@/features/payments/payment-methods";

export default async function SettleBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ item }, { items: methods }] = await Promise.all([
    getBillingCycle(id),
    listActivePaymentMethods(),
  ]);

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
          Send payment using the details below, then upload a receipt. OCR
          checks amount and date — a match is auto-approved.
        </p>
      </div>

      <PaymentInstructions methods={methods} />
      <SettleBillForm bill={item} />
    </div>
  );
}
