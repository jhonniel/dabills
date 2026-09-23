import Link from "next/link";
import { notFound } from "next/navigation";

import { PaymentInstructions } from "@/components/payments/payment-instructions";
import { SettleBillForm } from "@/components/payments/settle-bill-form";
import { getBillingCycle } from "@/features/billing/get-cycle";
import { listActivePaymentMethods } from "@/features/payments/payment-methods";
import { isLiveOcrEnabled } from "@/services/ocr/config";

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

  const ocrLive = isLiveOcrEnabled();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/billing"
          className="text-sm text-muted-foreground hover:text-cyan-300"
        >
          ← Back to billing
        </Link>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Settle bill
        </h1>
        <p className="mt-2 text-muted-foreground">
          Pay using the details below, then upload your transfer receipt as
          proof. OCR.space reads the amount and reference — if they match this
          bill, payment is auto-confirmed.
          {!ocrLive && (
            <span className="mt-1 block text-amber-200/90">
              Live OCR is off until you set a real OCR_SPACE_API_KEY.
            </span>
          )}
        </p>
      </div>

      <PaymentInstructions methods={methods} />
      <SettleBillForm bill={item} ocrLive={ocrLive} />
    </div>
  );
}
