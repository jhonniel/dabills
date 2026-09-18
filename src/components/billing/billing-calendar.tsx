"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { BillingCycleWithSubscription } from "@/features/billing/queries";
import { formatMoney } from "@/lib/billing/expenses";
import { BillStatusBadge } from "@/components/billing/bill-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function BillingCalendar({
  items,
  initialMonth,
}: {
  items: BillingCycleWithSubscription[];
  initialMonth?: string;
}) {
  const initial = initialMonth
    ? new Date(`${initialMonth}-01T12:00:00`)
    : new Date();
  const [cursor, setCursor] = useState(startOfMonth(initial));

  const monthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const billsByDay = useMemo(() => {
    const map = new Map<string, BillingCycleWithSubscription[]>();
    for (const item of items) {
      if (!item.due_date.startsWith(monthKey)) continue;
      const day = item.due_date.slice(8, 10);
      const list = map.get(day) ?? [];
      list.push(item);
      map.set(day, list);
    }
    return map;
  }, [items, monthKey]);

  const firstDow = startOfMonth(cursor).getDay();
  const totalDays = daysInMonth(cursor);
  const cells = Array.from({ length: firstDow + totalDays }, (_, index) => {
    if (index < firstDow) return null;
    return index - firstDow + 1;
  });

  const monthBills = items.filter((item) => item.due_date.startsWith(monthKey));

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-3 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold sm:text-lg">
          {cursor.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl sm:size-10"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl sm:size-10"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground sm:gap-2 sm:text-xs">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div key={`${day}-${index}`} className="sm:hidden">
            {day}
          </div>
        ))}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="hidden sm:block">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((day, index) => {
          if (!day) return <div key={`empty-${index}`} />;
          const key = String(day).padStart(2, "0");
          const dayBills = billsByDay.get(key) ?? [];
          const isToday =
            new Date().toISOString().slice(0, 10) === `${monthKey}-${key}`;

          return (
            <div
              key={key}
              className={cn(
                "min-h-12 rounded-xl border border-white/5 bg-white/[0.02] p-1 sm:min-h-24 sm:rounded-2xl sm:p-2",
                isToday && "border-cyan-400/40 bg-cyan-400/5"
              )}
            >
              <p className="text-[10px] font-medium sm:text-xs">{day}</p>
              {/* Mobile: dots only */}
              <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                {dayBills.slice(0, 3).map((bill) => (
                  <span
                    key={bill.id}
                    className="size-1.5 rounded-full bg-cyan-400/80"
                    title={bill.subscription?.name ?? "Bill"}
                  />
                ))}
              </div>
              {/* Desktop: names */}
              <div className="mt-1 hidden space-y-1 sm:block">
                {dayBills.slice(0, 2).map((bill) => (
                  <div
                    key={bill.id}
                    className="truncate rounded-md bg-white/5 px-1.5 py-1 text-[10px]"
                    title={`${bill.subscription?.name} · ${formatMoney(bill.amount, bill.currency)}`}
                  >
                    {bill.subscription?.name}
                  </div>
                ))}
                {dayBills.length > 2 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{dayBills.length - 2} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-2">
        <p className="text-sm font-medium">Bills this month</p>
        {monthBills.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-muted-foreground">
            No bills due this month.
          </p>
        )}
        {monthBills.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{item.subscription?.name}</p>
              <p className="text-xs text-muted-foreground">{item.due_date}</p>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="font-display text-sm">
                {formatMoney(item.amount, item.currency)}
              </span>
              <BillStatusBadge status={item.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
