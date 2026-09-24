"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { adminAssignUserToPlanAction } from "@/features/admin/actions";
import type { AdminUser } from "@/lib/admin/demo-store";
import { displayUserEmail } from "@/lib/admin/pending-email";
import { filterAdminUsers } from "@/lib/admin/user-search";
import { formatMoney, getNextBillingDate } from "@/lib/billing/expenses";
import { cn } from "@/lib/utils";
import type { SubscriptionPlanWithSeats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function defaultNextBill(
  plan: SubscriptionPlanWithSeats | undefined,
  fromDate: string
) {
  if (!plan) return fromDate;
  return getNextBillingDate(
    fromDate,
    plan.billing_frequency,
    plan.custom_interval_days
  );
}

function userLabel(user: AdminUser) {
  const name = user.full_name ?? "Unnamed";
  const code = user.code_name?.trim();
  const email = displayUserEmail(user.email);
  return code ? `${code} · ${name} · ${email}` : `${name} · ${email}`;
}

function UserSearchSelect({
  users,
  value,
  onChange,
}: {
  users: AdminUser[];
  value: string;
  onChange: (userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterAdminUsers(users, { like: query }),
    [users, query]
  );
  const selected = users.find((user) => user.id === value);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 w-full justify-between rounded-lg border-input bg-transparent px-3 font-normal md:h-8"
        >
          <span
            className={cn(
              "truncate text-left",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? userLabel(selected) : "Search and select user…"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-2"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, email, or code name…"
            className="h-9 pl-9 md:h-9 md:pl-9"
            autoFocus
          />
        </div>
        <div className="mt-2 max-h-56 overflow-y-auto overscroll-contain">
          {filtered.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              No users match.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((user) => {
                const active = user.id === value;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-white/5",
                        active && "bg-cyan-400/10 text-cyan-100"
                      )}
                      onClick={() => {
                        onChange(user.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "size-4 shrink-0",
                          active ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="min-w-0 truncate">{userLabel(user)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AdminAssignSubscriptionForm({
  users,
  plans,
  defaultUserId,
  defaultPlanId,
}: {
  users: AdminUser[];
  plans: SubscriptionPlanWithSeats[];
  defaultUserId?: string;
  defaultPlanId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const activePlans = useMemo(
    () => plans.filter((p) => p.status === "active"),
    [plans]
  );
  const [userId, setUserId] = useState(defaultUserId ?? "");
  const [planId, setPlanId] = useState(
    defaultPlanId && activePlans.some((p) => p.id === defaultPlanId)
      ? defaultPlanId
      : ""
  );
  const selected = activePlans.find((p) => p.id === planId);
  const [startDate, setStartDate] = useState(todayIso);
  const [nextBillingDate, setNextBillingDate] = useState(() =>
    defaultNextBill(
      activePlans.find((p) => p.id === (defaultPlanId ?? "")) ?? activePlans[0],
      todayIso()
    )
  );

  const remaining = selected
    ? Math.max(0, selected.max_capacity - selected.seats_used)
    : 0;
  const isFull = Boolean(selected && remaining === 0);

  const onPlanChange = (id: string) => {
    setPlanId(id);
    const plan = activePlans.find((p) => p.id === id);
    setNextBillingDate(defaultNextBill(plan, startDate));
  };

  const onStartDateChange = (value: string) => {
    setStartDate(value);
    if (selected) {
      setNextBillingDate(defaultNextBill(selected, value));
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId) {
      toast.error("Select a plan");
      return;
    }
    if (!userId) {
      toast.error("Select a user");
      return;
    }
    if (!startDate) {
      toast.error("Pick a start date");
      return;
    }
    if (!nextBillingDate) {
      toast.error("Pick the next bill date");
      return;
    }
    if (isFull) {
      toast.error("Plan is full");
      return;
    }

    startTransition(async () => {
      const result = await adminAssignUserToPlanAction({
        planId,
        userId,
        startDate,
        nextBillingDate,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Seat assigned");
      router.push("/admin/subscriptions/plans");
      router.refresh();
    });
  };

  if (activePlans.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-5 text-sm text-amber-100">
        <p>No active plans yet. Create a plan with max capacity first.</p>
        <Button asChild className="rounded-xl">
          <Link href="/admin/subscriptions/plans">Create a plan</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Plan</Label>
        <Select value={planId || undefined} onValueChange={onPlanChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            {activePlans.map((plan) => {
              const left = Math.max(0, plan.max_capacity - plan.seats_used);
              return (
                <SelectItem
                  key={plan.id}
                  value={plan.id}
                  disabled={left === 0}
                >
                  {plan.name} · {formatMoney(plan.amount, plan.currency)} ·{" "}
                  {plan.seats_used}/{plan.max_capacity}
                  {left === 0 ? " (full)" : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {selected && (
          <p className="text-xs text-muted-foreground">
            {isFull
              ? "This plan is full — pick another or raise capacity."
              : `${remaining} seat${remaining === 1 ? "" : "s"} remaining · ${formatMoney(selected.amount, selected.currency)} / ${selected.billing_frequency.replace("_", " ")}`}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Assign to user</Label>
        <UserSearchSelect
          users={users}
          value={userId}
          onChange={setUserId}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start-date">Start date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            When this subscription starts for the user.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="next-bill-date">Next bill date</Label>
          <Input
            id="next-bill-date"
            type="date"
            value={nextBillingDate}
            onChange={(e) => setNextBillingDate(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            When the bill will recur next. Auto-fills from start + cycle.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={
          pending || isFull || !planId || !userId || !startDate || !nextBillingDate
        }
        className="rounded-xl bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
      >
        {pending ? "Assigning..." : "Assign seat"}
      </Button>
    </form>
  );
}
