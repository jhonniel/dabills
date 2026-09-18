"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { settleBillAction } from "@/features/payments/actions";
import type { BillingCycleWithSubscription } from "@/features/billing/queries";
import { formatMoney } from "@/lib/billing/expenses";
import { BillStatusBadge } from "@/components/billing/bill-status-badge";
import { OcrResultCard } from "@/components/payments/ocr-result-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SettleResult = {
  paymentId: string;
  status: "pending" | "pending_verification" | "approved" | "rejected" | "failed";
  validation: import("@/services/ocr/validate").OcrValidationResult;
  extraction: {
    merchant: string | null;
    amount: number | null;
    referenceNumber: string | null;
    date: string | null;
    confidence: number;
    provider: string;
  };
};

export function SettleBillForm({
  bill,
}: {
  bill: BillingCycleWithSubscription;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [forceMismatch, setForceMismatch] = useState(false);
  const [result, setResult] = useState<SettleResult | null>(null);

  const preview = useMemo(() => {
    if (!result) return null;
    return result;
  }, [result]);

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="font-display text-xl">
                {bill.subscription?.name ?? "Subscription"}
              </CardTitle>
              <CardDescription>
                Due {bill.due_date} · {formatMoney(bill.amount, bill.currency)}
              </CardDescription>
            </div>
            <BillStatusBadge status={bill.status} />
          </div>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              formData.set("billingCycleId", bill.id);
              formData.set("forceMismatch", forceMismatch ? "true" : "false");

              startTransition(async () => {
                const response = await settleBillAction(formData);
                if (!response.success) {
                  toast.error(response.error);
                  return;
                }
                setResult(response.data ?? null);
                toast.success(
                  response.data?.validation.overallMatch
                    ? "Receipt matched — payment auto-approved"
                    : "Receipt mismatches — sent for admin review"
                );
                router.refresh();
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt image</Label>
              <label
                htmlFor="receipt"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition hover:border-cyan-400/30"
              >
                <Upload className="mb-3 size-6 text-cyan-300" />
                <p className="text-sm font-medium">
                  {fileName ?? "Click to upload receipt"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, or WEBP up to 8MB
                </p>
                <input
                  id="receipt"
                  name="receipt"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  required
                  onChange={(event) =>
                    setFileName(event.target.files?.[0]?.name ?? null)
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference number (optional)</Label>
                <Input
                  id="referenceNumber"
                  name="referenceNumber"
                  placeholder="Bank / wallet reference"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input id="notes" name="notes" placeholder="Payment channel, etc." />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
              <Checkbox
                id="forceMismatch"
                checked={forceMismatch}
                onCheckedChange={(checked) => setForceMismatch(Boolean(checked))}
              />
              <Label htmlFor="forceMismatch" className="text-xs text-muted-foreground">
                Demo: force OCR mismatch (to preview highlight states)
              </Label>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
              >
                {pending ? "Validating receipt..." : "Upload & validate"}
              </Button>
              <Button asChild type="button" variant="outline" className="rounded-xl">
                <Link href="/dashboard/billing">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {preview && (
        <OcrResultCard
          extraction={preview.extraction}
          validation={preview.validation}
          expected={{
            amount: Number(bill.amount),
            dueDate: bill.due_date,
            merchant: bill.subscription?.name ?? null,
          }}
          paymentId={preview.paymentId}
          status={preview.status}
        />
      )}
    </div>
  );
}
