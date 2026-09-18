"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  adminArchiveSubscriptionPlanAction,
  adminCreateSubscriptionPlanAction,
  adminDeleteSubscriptionPlanAction,
  adminUpdateSubscriptionPlanAction,
} from "@/features/admin/actions";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { formatMoney } from "@/lib/billing/expenses";
import type { Category, SubscriptionPlanWithSeats } from "@/types";
import type { BillingFrequency } from "@/types";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function domainFromLogoUrl(logoUrl: string | null | undefined) {
  if (!logoUrl) return "";
  try {
    if (logoUrl.startsWith("/api/logo") || logoUrl.includes("google.com/s2/favicons")) {
      return new URL(logoUrl, "http://local").searchParams.get("domain") ?? "";
    }
  } catch {
    return "";
  }
  return "";
}

function logoInputFromPlan(logoUrl: string | null | undefined) {
  const domain = domainFromLogoUrl(logoUrl);
  if (domain) return domain;
  return logoUrl ?? "";
}

/** Accepts brand domain (netflix.com) or a full / relative URL */
function resolveLogoUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  ) {
    return value;
  }
  const domain = value
    .replace(/^https?:\/\//i, "")
    .split("/")[0]
    ?.toLowerCase();
  if (!domain || !domain.includes(".")) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function PlanLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = initialsFor(name || "?");

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm",
        className
      )}
    >
      {!logoUrl || failed ? (
        <span className="font-display text-xs font-semibold text-zinc-800">
          {initials}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          width={40}
          height={40}
          className="size-6 object-contain"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function AdminSubscriptionPlansPanel({
  plans,
  categories,
}: {
  plans: SubscriptionPlanWithSeats[];
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [logoInput, setLogoInput] = useState("");
  const [categoryId, setCategoryId] = useState<string>("none");
  const [amount, setAmount] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("4");
  const [billingFrequency, setBillingFrequency] =
    useState<BillingFrequency>("monthly");
  const [customIntervalDays, setCustomIntervalDays] = useState("");
  const [notes, setNotes] = useState("");

  const editingPlan = editingId
    ? plans.find((plan) => plan.id === editingId)
    : null;

  const previewLogoUrl = resolveLogoUrl(logoInput);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setLogoInput("");
    setCategoryId("none");
    setAmount("");
    setMaxCapacity("4");
    setBillingFrequency("monthly");
    setCustomIntervalDays("");
    setNotes("");
  };

  const loadPlan = (plan: SubscriptionPlanWithSeats) => {
    setEditingId(plan.id);
    setName(plan.name);
    setLogoInput(logoInputFromPlan(plan.logo_url));
    setCategoryId(plan.category_id ?? "none");
    setAmount(String(plan.amount));
    setMaxCapacity(String(plan.max_capacity));
    setBillingFrequency(plan.billing_frequency);
    setCustomIntervalDays(
      plan.custom_interval_days != null ? String(plan.custom_interval_days) : ""
    );
    setNotes(plan.notes ?? "");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const buildPayload = () => ({
    name,
    categoryId: categoryId === "none" ? null : categoryId,
    logoUrl: resolveLogoUrl(logoInput) ?? "",
    amount: Number(amount),
    currency: DEFAULT_CURRENCY,
    billingFrequency,
    customIntervalDays:
      billingFrequency === "custom" ? Number(customIntervalDays) || null : null,
    maxCapacity: Number(maxCapacity),
    notes: notes || null,
    status: editingPlan?.status ?? ("active" as const),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-100">
              {editingId ? "Edit plan" : "Create plan"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {editingId
                ? "Update logo, pricing, capacity, or billing details."
                : "Define a shared subscription with a max seat capacity."}
            </p>
          </div>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-zinc-400"
              onClick={resetForm}
            >
              Cancel edit
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="plan-name" className="text-zinc-400">
              Name
            </Label>
            <Input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Netflix Family"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="plan-logo" className="text-zinc-400">
              Logo
            </Label>
            <div className="flex items-center gap-3">
              <PlanLogo
                key={previewLogoUrl ?? "empty"}
                name={name || "Plan"}
                logoUrl={previewLogoUrl}
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Input
                  id="plan-logo"
                  value={logoInput}
                  onChange={(e) => setLogoInput(e.target.value)}
                  placeholder="netflix.com or https://…"
                />
                <p className="text-xs text-zinc-600">
                  Brand domain (fetches favicon) or a direct image URL.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-amount" className="text-zinc-400">
              Amount (₱)
            </Label>
            <Input
              id="plan-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="649"
            />
            {editingId && (
              <p className="text-xs text-zinc-600">
                Price changes apply to seats going forward only. Past and due
                bills keep their original amount.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan-capacity" className="text-zinc-400">
              Max capacity
            </Label>
            <Input
              id="plan-capacity"
              type="number"
              min={editingPlan ? Math.max(1, editingPlan.seats_used) : 1}
              step="1"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
            />
            {editingPlan && editingPlan.seats_used > 0 && (
              <p className="text-xs text-zinc-500">
                {editingPlan.seats_used} seat
                {editingPlan.seats_used === 1 ? "" : "s"} currently assigned
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Billing frequency</Label>
            <Select
              value={billingFrequency}
              onValueChange={(value) =>
                setBillingFrequency(value as BillingFrequency)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="semi_annual">Semi-annual</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {billingFrequency === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="plan-interval" className="text-zinc-400">
                Custom interval (days)
              </Label>
              <Input
                id="plan-interval"
                type="number"
                min="1"
                value={customIntervalDays}
                onChange={(e) => setCustomIntervalDays(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="plan-notes" className="text-zinc-400">
              Notes
            </Label>
            <Textarea
              id="plan-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional internal note"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              disabled={pending || !name.trim() || amount === ""}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
              onClick={() => {
                startTransition(async () => {
                  const payload = buildPayload();
                  if (
                    editingPlan &&
                    payload.maxCapacity < editingPlan.seats_used
                  ) {
                    toast.error(
                      `Capacity cannot be below seats in use (${editingPlan.seats_used})`
                    );
                    return;
                  }

                  const result = editingId
                    ? await adminUpdateSubscriptionPlanAction({
                        id: editingId,
                        plan: payload,
                      })
                    : await adminCreateSubscriptionPlanAction(payload);

                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(editingId ? "Plan updated" : "Plan created");
                  resetForm();
                  router.refresh();
                });
              }}
            >
              {editingId ? "Save changes" : "Create plan"}
            </Button>
            {editingId && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-white/10"
                disabled={pending}
                onClick={resetForm}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Plans
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {plans.length} plan{plans.length === 1 ? "" : "s"}
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-sm text-zinc-400">No plans yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Create one above, then assign seats.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {plans.map((plan) => {
              const remaining = Math.max(0, plan.max_capacity - plan.seats_used);
              const full = remaining === 0;
              const isEditing = editingId === plan.id;

              return (
                <li
                  key={plan.id}
                  className={
                    isEditing
                      ? "bg-cyan-400/[0.04] px-5 py-4 sm:px-6"
                      : "px-5 py-4 sm:px-6"
                  }
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <PlanLogo
                        key={plan.logo_url ?? plan.id}
                        name={plan.name}
                        logoUrl={plan.logo_url}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-display text-base font-semibold text-zinc-100">
                            {plan.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              plan.status === "active"
                                ? full
                                  ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                                  : "border-teal-400/30 bg-teal-400/10 text-teal-200"
                                : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                            }
                          >
                            {plan.status === "archived"
                              ? "Archived"
                              : full
                                ? "Full"
                                : "Open"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatMoney(plan.amount, plan.currency)} ·{" "}
                          {plan.billing_frequency.replace("_", " ")} ·{" "}
                          {plan.seats_used}/{plan.max_capacity} seats
                          {!full && plan.status === "active"
                            ? ` · ${remaining} left`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9 rounded-lg border-white/10"
                        disabled={pending}
                        onClick={() => loadPlan(plan)}
                      >
                        Edit
                      </Button>
                      {plan.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-9 rounded-lg border-white/10"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              const result =
                                await adminArchiveSubscriptionPlanAction(
                                  plan.id
                                );
                              if (!result.success) {
                                toast.error(result.error);
                                return;
                              }
                              toast.success("Plan archived");
                              if (editingId === plan.id) resetForm();
                              router.refresh();
                            });
                          }}
                        >
                          Archive
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9 rounded-lg border-red-400/30 text-red-200 hover:bg-red-400/10"
                        disabled={pending || plan.seats_used > 0}
                        title={
                          plan.seats_used > 0
                            ? "Remove assigned seats before deleting"
                            : "Delete plan permanently"
                        }
                        onClick={() => {
                          if (
                            !window.confirm(
                              `Delete “${plan.name}”? This cannot be undone.`
                            )
                          ) {
                            return;
                          }
                          startTransition(async () => {
                            const result =
                              await adminDeleteSubscriptionPlanAction(plan.id);
                            if (!result.success) {
                              toast.error(result.error);
                              return;
                            }
                            toast.success("Plan deleted");
                            if (editingId === plan.id) resetForm();
                            router.refresh();
                          });
                        }}
                      >
                        Delete
                      </Button>
                      {plan.status === "active" && !full && (
                        <Button
                          asChild
                          size="sm"
                          className="min-h-9 rounded-lg bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
                        >
                          <a
                            href={`/admin/subscriptions/assign?planId=${plan.id}`}
                          >
                            Assign seat
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
