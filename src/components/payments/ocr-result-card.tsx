"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { reviewPaymentAction } from "@/features/payments/actions";
import type { OcrValidationResult } from "@/services/ocr/validate";
import type { PaymentStatus } from "@/types";
import { formatMoney } from "@/lib/billing/expenses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function OcrResultCard({
  extraction,
  validation,
  expected,
  paymentId,
  status,
}: {
  extraction: {
    merchant: string | null;
    amount: number | null;
    referenceNumber: string | null;
    date: string | null;
    confidence: number;
    provider: string;
  };
  validation: OcrValidationResult;
  expected: {
    amount: number;
    dueDate: string;
    merchant: string | null;
  };
  paymentId: string;
  status: PaymentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const rows = [
    {
      field: "Merchant" as const,
      expected: expected.merchant ?? "—",
      actual: extraction.merchant ?? "—",
      match: validation.merchantMatch,
    },
    {
      field: "Amount" as const,
      expected: formatMoney(expected.amount),
      actual:
        extraction.amount !== null ? formatMoney(extraction.amount) : "—",
      match: validation.amountMatch,
    },
    {
      field: "Date" as const,
      expected: expected.dueDate,
      actual: extraction.date ?? "—",
      match: validation.dateMatch,
    },
    {
      field: "Reference" as const,
      expected: "—",
      actual: extraction.referenceNumber ?? "—",
      match: true,
    },
  ];

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">OCR validation</CardTitle>
            <CardDescription>
              Provider: {extraction.provider} · Confidence{" "}
              {Math.round(extraction.confidence * 100)}%
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              validation.overallMatch
                ? "border-teal-400/30 bg-teal-400/10 text-teal-200"
                : "border-amber-400/30 bg-amber-400/10 text-amber-200"
            )}
          >
            {validation.overallMatch ? "Matched" : "Mismatches found"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-4 gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-muted-foreground">
            <span>Field</span>
            <span>Expected</span>
            <span>Extracted</span>
            <span>Status</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.field}
              className={cn(
                "grid grid-cols-4 gap-2 px-4 py-3 text-sm",
                !row.match && "bg-rose-500/10"
              )}
            >
              <span className="font-medium">{row.field}</span>
              <span className="text-muted-foreground">{row.expected}</span>
              <span>{row.actual}</span>
              <span className={row.match ? "text-teal-300" : "text-rose-300"}>
                {row.match ? "Match" : "Mismatch"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Payment status:{" "}
          <span className="capitalize text-foreground">
            {status.replaceAll("_", " ")}
          </span>
          . Matched receipts move to pending verification until approved.
        </p>

        <div className="flex flex-wrap gap-2">
          {status === "pending_verification" && (
            <>
              <Button
                disabled={pending}
                className="rounded-xl bg-teal-500 text-black hover:bg-teal-400"
                onClick={() => {
                  startTransition(async () => {
                    const response = await reviewPaymentAction({
                      paymentId,
                      decision: "approved",
                    });
                    if (!response.success) {
                      toast.error(response.error);
                      return;
                    }
                    toast.success("Payment approved");
                    router.push("/dashboard/payments");
                    router.refresh();
                  });
                }}
              >
                <Check className="size-4" />
                Approve payment
              </Button>
              <Button
                disabled={pending}
                variant="outline"
                className="rounded-xl border-rose-400/30 text-rose-300"
                onClick={() => {
                  startTransition(async () => {
                    const response = await reviewPaymentAction({
                      paymentId,
                      decision: "rejected",
                      rejectionReason: "OCR / receipt mismatch",
                    });
                    if (!response.success) {
                      toast.error(response.error);
                      return;
                    }
                    toast.success("Payment rejected");
                    router.push("/dashboard/payments");
                    router.refresh();
                  });
                }}
              >
                <X className="size-4" />
                Reject
              </Button>
            </>
          )}
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/dashboard/payments">View payment history</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
