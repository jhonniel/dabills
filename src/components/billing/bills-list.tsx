"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateBillStatusAction } from "@/features/billing/actions";
import type { BillingCycleWithSubscription } from "@/features/billing/queries";
import { formatMoney } from "@/lib/billing/expenses";
import { BillStatusBadge } from "@/components/billing/bill-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function BillActions({
  id,
  status,
}: {
  id: string;
  status: BillingCycleWithSubscription["status"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (status === "paid") return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="rounded-lg"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await updateBillStatusAction(id, "paid");
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Marked as paid");
          router.refresh();
        });
      }}
    >
      Mark paid
    </Button>
  );
}

export function BillsTable({ items }: { items: BillingCycleWithSubscription[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">No bills found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Generate upcoming bills from your active subscriptions to populate this view.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10 hover:bg-transparent">
            <TableHead>Subscription</TableHead>
            <TableHead>Due date</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-white/10">
              <TableCell>
                <p className="font-medium">{item.subscription?.name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.subscription?.billing_frequency?.replace("_", " ") ?? "—"}
                </p>
              </TableCell>
              <TableCell>{item.due_date}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {item.period_start} → {item.period_end}
              </TableCell>
              <TableCell>{formatMoney(item.amount, item.currency)}</TableCell>
              <TableCell>
                <BillStatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <BillActions id={item.id} status={item.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function BillsCards({ items }: { items: BillingCycleWithSubscription[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">No bills found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">
                {item.subscription?.name ?? "Unknown"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Due {item.due_date}</p>
            </div>
            <BillStatusBadge status={item.status} />
          </div>
          <p className="mt-4 font-display text-2xl font-semibold text-cyan-200">
            {formatMoney(item.amount, item.currency)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Period {item.period_start} → {item.period_end}
          </p>
          <div className="mt-4">
            <BillActions id={item.id} status={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
