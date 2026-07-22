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

function SubscriptionActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Actions">
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
        <p className="font-display text-lg font-semibold">No subscriptions found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add your first recurring bill to start tracking spend.
        </p>
        <Button asChild className="mt-6 rounded-xl">
          <Link href="/dashboard/subscriptions/new">Add subscription</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
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
                    style={{ backgroundColor: item.category?.color ?? "#94A3B8" }}
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
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <SubscriptionActions id={item.id} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
