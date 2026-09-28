"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { adminUpdateAssignedDatesAction } from "@/features/admin/actions";
import type { AssignedSubscription } from "@/features/admin/queries";
import { formatMoney } from "@/lib/billing/expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function AssignmentDates({ item }: { item: AssignedSubscription }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState(item.start_date.slice(0, 10));
  const [nextBillingDate, setNextBillingDate] = useState(
    item.next_billing_date.slice(0, 10)
  );
  const dirty =
    startDate !== item.start_date.slice(0, 10) ||
    nextBillingDate !== item.next_billing_date.slice(0, 10);

  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground capitalize">
          {formatMoney(item.amount, item.currency)} · {item.status}
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor={`${item.id}-start`} className="text-xs text-muted-foreground">
            Start date
          </Label>
          <Input
            id={`${item.id}-start`}
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${item.id}-next`} className="text-xs text-muted-foreground">
            Next billing
          </Label>
          <Input
            id={`${item.id}-next`}
            type="date"
            value={nextBillingDate}
            onChange={(event) => setNextBillingDate(event.target.value)}
            className="h-9"
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={pending || !dirty}
          className="rounded-lg"
          onClick={() => {
            startTransition(async () => {
              const result = await adminUpdateAssignedDatesAction({
                subscriptionId: item.id,
                startDate,
                nextBillingDate,
              });
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              toast.success(`Updated dates for ${item.name}`);
              router.refresh();
            });
          }}
        >
          {pending ? "Saving..." : "Save dates"}
        </Button>
      </div>
    </li>
  );
}

export function UserAssignmentsEditor({
  items,
}: {
  items: AssignedSubscription[];
}) {
  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">None assigned</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <AssignmentDates
          key={`${item.id}:${item.start_date}:${item.next_billing_date}`}
          item={item}
        />
      ))}
    </ul>
  );
}
