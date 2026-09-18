"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  createSubscriptionAction,
  updateSubscriptionAction,
} from "@/features/subscriptions/actions";
import type { SubscriptionWithCategory } from "@/lib/billing/demo-data";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import type { Category } from "@/types";
import {
  subscriptionSchema,
  type SubscriptionInput,
} from "@/validators/subscription";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

function toFormValues(item?: SubscriptionWithCategory | null): SubscriptionInput {
  if (!item) {
    const today = new Date().toISOString().slice(0, 10);
    return {
      name: "",
      categoryId: null,
      logoUrl: "",
      amount: 0,
      currency: DEFAULT_CURRENCY,
      billingFrequency: "monthly",
      customIntervalDays: null,
      startDate: today,
      renewalDate: today,
      autoRenewal: true,
      reminderDays: [5, 3, 1],
      status: "active",
      notes: "",
    };
  }

  return {
    name: item.name,
    categoryId: item.category_id,
    logoUrl: item.logo_url ?? "",
    amount: item.amount,
    currency: item.currency,
    billingFrequency: item.billing_frequency,
    customIntervalDays: item.custom_interval_days,
    startDate: item.start_date,
    renewalDate: item.renewal_date,
    autoRenewal: item.auto_renewal,
    reminderDays: item.reminder_days,
    status: item.status,
    notes: item.notes ?? "",
  };
}

export function SubscriptionForm({
  categories,
  subscription,
}: {
  categories: Category[];
  subscription?: SubscriptionWithCategory | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEdit = Boolean(subscription);

  const form = useForm<SubscriptionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(subscriptionSchema) as any,
    defaultValues: toFormValues(subscription),
  });

  const frequency = form.watch("billingFrequency");

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const payload: SubscriptionInput = {
        ...values,
        logoUrl: values.logoUrl || "",
        categoryId: values.categoryId || null,
        notes: values.notes || null,
      };

      const result = isEdit
        ? await updateSubscriptionAction(subscription!.id, payload)
        : await createSubscriptionAction(payload);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEdit ? "Subscription updated" : "Subscription created");
      const id = isEdit ? subscription!.id : result.data?.id;
      router.push(id ? `/dashboard/subscriptions/${id}` : "/dashboard/subscriptions");
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Netflix" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.watch("categoryId") ?? "none"}
            onValueChange={(value) =>
              form.setValue("categoryId", value === "none" ? null : value)
            }
          >
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
          <Label>Status</Label>
          <Select
            value={form.watch("status")}
            onValueChange={(value) =>
              form.setValue("status", value as SubscriptionInput["status"])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            {...form.register("amount", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch("currency")}
            onValueChange={(value) => form.setValue("currency", value)}
          >
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PHP">PHP (₱)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Billing frequency</Label>
          <Select
            value={form.watch("billingFrequency")}
            onValueChange={(value) =>
              form.setValue(
                "billingFrequency",
                value as SubscriptionInput["billingFrequency"]
              )
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

        {frequency === "custom" && (
          <div className="space-y-2">
            <Label htmlFor="customIntervalDays">Custom interval (days)</Label>
            <Input
              id="customIntervalDays"
              type="number"
              min="1"
              {...form.register("customIntervalDays", {
                setValueAs: (value) =>
                  value === "" || value === null || value === undefined
                    ? null
                    : Number(value),
              })}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" type="date" {...form.register("startDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="renewalDate">Renewal date</Label>
          <Input id="renewalDate" type="date" {...form.register("renewalDate")} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            placeholder="https://..."
            {...form.register("logoUrl")}
          />
          {form.formState.errors.logoUrl && (
            <p className="text-xs text-destructive">
              {form.formState.errors.logoUrl.message}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} {...form.register("notes")} />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <Checkbox
            id="autoRenewal"
            checked={form.watch("autoRenewal")}
            onCheckedChange={(checked) =>
              form.setValue("autoRenewal", Boolean(checked))
            }
          />
          <Label htmlFor="autoRenewal">Auto renewal enabled</Label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
        >
          {pending ? "Saving..." : isEdit ? "Save changes" : "Add subscription"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
