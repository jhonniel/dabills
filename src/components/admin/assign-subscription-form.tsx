"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { adminAssignUserToPlanAction } from "@/features/admin/actions";
import type { AdminUser } from "@/lib/admin/demo-store";
import {
  filterAdminUsers,
  type UserSearchHasFilter,
} from "@/lib/admin/user-search";
import { formatMoney, getNextBillingDate } from "@/lib/billing/expenses";
import type { SubscriptionPlanWithSeats } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  const [userLike, setUserLike] = useState("");
  const [userHas, setUserHas] = useState<UserSearchHasFilter[]>([]);
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

  const filteredUsers = useMemo(
    () => filterAdminUsers(users, { like: userLike, has: userHas }),
    [users, userLike, userHas]
  );

  useEffect(() => {
    if (userId && !filteredUsers.some((user) => user.id === userId)) {
      setUserId("");
    }
  }, [filteredUsers, userId]);

  const remaining = selected
    ? Math.max(0, selected.max_capacity - selected.seats_used)
    : 0;
  const isFull = Boolean(selected && remaining === 0);

  const toggleHas = (filter: UserSearchHasFilter) => {
    setUserHas((prev) =>
      prev.includes(filter)
        ? prev.filter((item) => item !== filter)
        : [...prev, filter]
    );
  };

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
        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={userLike}
              onChange={(e) => setUserLike(e.target.value)}
              placeholder="Search like name, email, or code name…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Has:</span>
            {(
              [
                { id: "code_name" as const, label: "Code name" },
                { id: "subscriptions" as const, label: "Subscriptions" },
              ] as const
            ).map((item) => {
              const active = userHas.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleHas(item.id)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    active
                      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 text-muted-foreground hover:border-white/20"
                  )}
                >
                  {item.label}
                </button>
              );
            })}
            <span className="ml-auto text-xs text-muted-foreground">
              {filteredUsers.length} users
            </span>
          </div>
        </div>
        <Select value={userId || undefined} onValueChange={setUserId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {filteredUsers.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.code_name ? `${user.code_name} · ` : ""}
                {user.full_name ?? "Unnamed"} · {user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filteredUsers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No users match like/has filters.
          </p>
        )}
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
