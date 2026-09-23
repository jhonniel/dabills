"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteSubscriptionAction } from "@/features/subscriptions/actions";
import type { SubscriptionWithCategory } from "@/lib/billing/demo-data";
import { formatMoney, toMonthlyAmount } from "@/lib/billing/expenses";
import { StatusBadge } from "@/components/subscriptions/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function SubscriptionActions({
  id,
  locked,
}: {
  id: string;
  locked?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (locked) {
    return (
      <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
        Admin
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Actions" className="size-9">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/subscriptions/${id}/edit`}>
            <Pencil className="size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const result = await deleteSubscriptionAction(id);
              if (!result.success) {
                toast.error(result.error);
                return;
              }
              toast.success("Subscription deleted");
              router.refresh();
            });
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
          An admin must assign subscriptions to your account.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
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
              </div>
              <SubscriptionActions id={item.id} locked={Boolean(item.plan_id)} />
            </div>
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
                  /mo · next {item.next_billing_date}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge status={item.status} />
                {item.plan_id && (
                  <span className="text-[10px] text-zinc-500">Admin assigned</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Subscription</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Next billing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
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
                <TableCell>{item.next_billing_date}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge status={item.status} />
                    {item.plan_id && (
                      <span className="text-[10px] text-zinc-500">Admin assigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <SubscriptionActions
                    id={item.id}
                    locked={Boolean(item.plan_id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
