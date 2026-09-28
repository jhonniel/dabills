"use client";

import Link from "next/link";

import type { SubscriptionWithCategory } from "@/lib/billing/demo-data";
import { formatMoney, toMonthlyAmount } from "@/lib/billing/expenses";
import { StatusBadge } from "@/components/subscriptions/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SubscriptionsTable({
  items,
}: {
  items: SubscriptionWithCategory[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">No subscriptions yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          An admin assigns subscriptions to your account. You can view them here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <Link
              href={`/dashboard/subscriptions/${item.id}`}
              className="font-medium hover:text-cyan-300"
            >
              {item.name}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground capitalize">
              {item.billing_frequency.replace("_", " ")} ·{" "}
              {item.category?.name ?? "Others"}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-base font-semibold">
                  {formatMoney(item.amount, item.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMoney(
                    toMonthlyAmount(
                      item.amount,
                      item.billing_frequency,
                      item.custom_interval_days
                    ),
                    item.currency
                  )}
                  /mo · started {item.start_date}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Subscription</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="border-white/10">
                <TableCell>
                  <Link
                    href={`/dashboard/subscriptions/${item.id}`}
                    className="font-medium hover:text-cyan-300"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.billing_frequency.replace("_", " ")}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-2 text-sm">
                    <span
                      className="size-2 rounded-full"
                      style={{
                        backgroundColor: item.category?.color ?? "#94A3B8",
                      }}
                    />
                    {item.category?.name ?? "Others"}
                  </span>
                </TableCell>
                <TableCell>{formatMoney(item.amount, item.currency)}</TableCell>
                <TableCell>
                  {formatMoney(
                    toMonthlyAmount(
                      item.amount,
                      item.billing_frequency,
                      item.custom_interval_days
                    ),
                    item.currency
                  )}
                </TableCell>
                <TableCell>{item.start_date}</TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
