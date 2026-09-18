"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  adminArchiveExpenseAction,
  adminCreateExpenseAction,
  adminUpdateExpenseAction,
} from "@/features/admin/actions";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { formatMoney } from "@/lib/billing/expenses";
import type { AdminExpense, BillingFrequency, Category } from "@/types";
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminExpensesPanel({
  expenses,
  categories,
}: {
  expenses: AdminExpense[];
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [billingFrequency, setBillingFrequency] =
    useState<BillingFrequency>("monthly");
  const [customIntervalDays, setCustomIntervalDays] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [nextRecurrenceDate, setNextRecurrenceDate] = useState("");
  const [notes, setNotes] = useState("");

  const editing = editingId
    ? expenses.find((item) => item.id === editingId)
    : null;

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategoryId("none");
    setAmount("");
    setIsRecurring(false);
    setBillingFrequency("monthly");
    setCustomIntervalDays("");
    setExpenseDate(todayIso());
    setNextRecurrenceDate("");
    setNotes("");
  };

  const loadExpense = (item: AdminExpense) => {
    setEditingId(item.id);
    setName(item.name);
    setCategoryId(item.category_id ?? "none");
    setAmount(String(item.amount));
    setIsRecurring(item.is_recurring);
    setBillingFrequency(item.billing_frequency ?? "monthly");
    setCustomIntervalDays(
      item.custom_interval_days != null ? String(item.custom_interval_days) : ""
    );
    setExpenseDate(item.expense_date);
    setNextRecurrenceDate(item.next_recurrence_date ?? "");
    setNotes(item.notes ?? "");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const buildPayload = () => ({
    name,
    categoryId: categoryId === "none" ? null : categoryId,
    amount: Number(amount),
    currency: DEFAULT_CURRENCY,
    isRecurring,
    billingFrequency: isRecurring ? billingFrequency : null,
    customIntervalDays:
      isRecurring && billingFrequency === "custom"
        ? Number(customIntervalDays) || null
        : null,
    expenseDate,
    nextRecurrenceDate:
      isRecurring && nextRecurrenceDate ? nextRecurrenceDate : null,
    notes: notes || null,
    status: editing?.status ?? ("active" as const),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-100">
              {editingId ? "Edit expense" : "Add expense"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Track one-time or recurring ops costs. Recurring items show the
              next due date.
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
            <Label htmlFor="expense-name" className="text-zinc-400">
              Name
            </Label>
            <Input
              id="expense-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vercel Pro"
            />
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
            <Label htmlFor="expense-amount" className="text-zinc-400">
              Amount (₱)
            </Label>
            <Input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1149"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-date" className="text-zinc-400">
              Expense date
            </Label>
            <Input
              id="expense-date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-400">Type</Label>
            <Select
              value={isRecurring ? "recurring" : "one_time"}
              onValueChange={(value) => setIsRecurring(value === "recurring")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">One-time</SelectItem>
                <SelectItem value="recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isRecurring && (
            <>
              <div className="space-y-2">
                <Label className="text-zinc-400">Recurs every</Label>
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
                  <Label htmlFor="expense-interval" className="text-zinc-400">
                    Custom interval (days)
                  </Label>
                  <Input
                    id="expense-interval"
                    type="number"
                    min="1"
                    value={customIntervalDays}
                    onChange={(e) => setCustomIntervalDays(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="expense-next" className="text-zinc-400">
                  Next recurrence date
                </Label>
                <Input
                  id="expense-next"
                  type="date"
                  value={nextRecurrenceDate}
                  onChange={(e) => setNextRecurrenceDate(e.target.value)}
                />
                <p className="text-xs text-zinc-600">
                  Leave blank to auto-calculate from the expense date and
                  frequency.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="expense-notes" className="text-zinc-400">
              Notes
            </Label>
            <Textarea
              id="expense-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional internal note"
            />
          </div>

          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button
              disabled={pending || !name.trim() || amount === "" || !expenseDate}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
              onClick={() => {
                startTransition(async () => {
                  const payload = buildPayload();
                  const result = editingId
                    ? await adminUpdateExpenseAction({
                        id: editingId,
                        expense: payload,
                      })
                    : await adminCreateExpenseAction(payload);

                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success(
                    editingId ? "Expense updated" : "Expense created"
                  );
                  resetForm();
                  router.refresh();
                });
              }}
            >
              {editingId ? "Save changes" : "Add expense"}
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
            Expenses
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {expenses.length} item{expenses.length === 1 ? "" : "s"}
          </p>
        </div>

        {expenses.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-sm text-zinc-400">No expenses yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Add a one-time or recurring cost above.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {expenses.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <li
                  key={item.id}
                  className={
                    isEditing
                      ? "bg-cyan-400/[0.04] px-5 py-4 sm:px-6"
                      : "px-5 py-4 sm:px-6"
                  }
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-display text-base font-semibold text-zinc-100">
                          {item.name}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            item.status === "archived"
                              ? "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                              : item.is_recurring
                                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                                : "border-teal-400/30 bg-teal-400/10 text-teal-200"
                          }
                        >
                          {item.status === "archived"
                            ? "Archived"
                            : item.is_recurring
                              ? "Recurring"
                              : "One-time"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        {formatMoney(item.amount, item.currency)}
                        {item.is_recurring && item.billing_frequency
                          ? ` · ${item.billing_frequency.replace("_", " ")}`
                          : ""}
                        {" · "}
                        {item.is_recurring
                          ? `Next ${formatDate(item.next_recurrence_date)}`
                          : `On ${formatDate(item.expense_date)}`}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="min-h-9 rounded-lg border-white/10"
                        disabled={pending}
                        onClick={() => loadExpense(item)}
                      >
                        Edit
                      </Button>
                      {item.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="min-h-9 rounded-lg border-white/10"
                          disabled={pending}
                          onClick={() => {
                            startTransition(async () => {
                              const result = await adminArchiveExpenseAction(
                                item.id
                              );
                              if (!result.success) {
                                toast.error(result.error);
                                return;
                              }
                              toast.success("Expense archived");
                              if (editingId === item.id) resetForm();
                              router.refresh();
                            });
                          }}
                        >
                          Archive
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
