"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";

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
    dueDate?: string;
    merchant?: string | null;
  };
  paymentId: string;
  status: PaymentStatus;
}) {
  const rows = [
    {
      field: "Amount",
      expected: formatMoney(expected.amount),
      actual:
        extraction.amount !== null ? formatMoney(extraction.amount) : "—",
      match: validation.amountMatch,
    },
    {
      field: "Reference",
      expected: "On receipt",
      actual: extraction.referenceNumber ?? "—",
      match: validation.referenceMatch,
    },
  ];

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">
              Proof of payment check
            </CardTitle>
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
            {validation.overallMatch ? "Auto-confirmed" : "Needs review"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <div className="hidden min-w-[28rem] sm:block">
            <div className="grid grid-cols-4 gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-muted-foreground">
              <span>Field</span>
              <span>Expected</span>
              <span>From receipt</span>
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
                <span className="break-all">{row.actual}</span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    row.match ? "text-teal-300" : "text-rose-300"
                  )}
                >
                  {row.match ? (
                    <>
                      <Check className="size-3.5" /> Match
                    </>
                  ) : (
                    <>
                      <X className="size-3.5" /> Missing
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 p-3 sm:hidden">
            {rows.map((row) => (
              <div
                key={row.field}
                className={cn(
                  "rounded-xl border border-white/10 px-3 py-3 text-sm",
                  !row.match && "border-rose-400/20 bg-rose-500/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{row.field}</span>
                  <span className={row.match ? "text-teal-300" : "text-rose-300"}>
                    {row.match ? "Match" : "Missing"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Expected: {row.expected}
                </p>
                <p className="mt-1 break-all text-xs">From receipt: {row.actual}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Payment status:{" "}
          <span className="capitalize text-foreground">
            {status.replaceAll("_", " ")}
          </span>
          . Matching bill amount and a transfer reference auto-confirms the bill
          as paid. The receipt is compressed before storage.
        </p>

        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/dashboard/payments">View payment history</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
