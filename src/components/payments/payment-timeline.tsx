"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { reviewPaymentAction } from "@/features/payments/actions";
import type { PaymentListItem } from "@/features/payments/queries";
import { formatMoney } from "@/lib/billing/expenses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
  pending_verification: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  approved: "border-teal-400/30 bg-teal-400/10 text-teal-200",
  rejected: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  failed: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
};

export function PaymentTimeline({ items }: { items: PaymentListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">No payments yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Settle a bill from the Billing page to start your payment history.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link href="/dashboard/billing">Go to billing</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="relative pl-6">
          <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-cyan-400" />
          {index < items.length - 1 && (
            <span className="absolute top-4 left-[4px] h-[calc(100%-4px)] w-px bg-white/10" />
          )}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {item.subscription_name ?? "Payment"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                  {item.due_date ? ` · Due ${item.due_date}` : ""}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Ref: {item.reference_number ?? "—"} · Merchant:{" "}
                  {item.merchant ?? "—"}
                </p>
                {item.receipt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Receipt: {item.receipt.file_name} · OCR{" "}
                    {item.receipt.ocr_provider ?? "n/a"}
                    {item.receipt.confidence != null
                      ? ` · ${Math.round(Number(item.receipt.confidence) * 100)}%`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-display text-sm font-semibold">
                  {formatMoney(item.amount, item.currency)}
                </p>
                <Badge
                  variant="outline"
                  className={cn("capitalize", statusStyles[item.status])}
                >
                  {item.status.replaceAll("_", " ")}
                </Badge>
                {item.status === "pending_verification" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="rounded-lg"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await reviewPaymentAction({
                            paymentId: item.id,
                            decision: "approved",
                          });
                          if (!result.success) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Payment approved");
                          router.refresh();
                        });
                      }}
                    >
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          const result = await reviewPaymentAction({
                            paymentId: item.id,
                            decision: "rejected",
                            rejectionReason: "Rejected from history",
                          });
                          if (!result.success) {
                            toast.error(result.error);
                            return;
                          }
                          toast.success("Payment rejected");
                          router.refresh();
                        });
                      }}
                    >
                      <X className="size-3.5" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
