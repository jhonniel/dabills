"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { getNextBillingDate } from "@/lib/billing/expenses";
import {
  createDemoSubscription,
  deleteDemoSubscription,
  updateDemoSubscription,
} from "@/lib/billing/demo-store";
import { createClient } from "@/lib/supabase/server";
import {
  subscriptionSchema,
  type SubscriptionInput,
} from "@/validators/subscription";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function revalidateSubscriptionPaths(id?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/analytics");
  if (id) {
    revalidatePath(`/dashboard/subscriptions/${id}`);
    revalidatePath(`/dashboard/subscriptions/${id}/edit`);
  }
}

export async function createSubscriptionAction(
  input: SubscriptionInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid subscription",
    };
  }

  if (!isSupabaseConfigured()) {
    const created = await createDemoSubscription(parsed.data);
    revalidateSubscriptionPaths(created.id);
    return { success: true, data: { id: created.id } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const created = await createDemoSubscription(parsed.data);
    revalidateSubscriptionPaths(created.id);
    return { success: true, data: { id: created.id } };
  }

  const nextBilling = getNextBillingDate(
    parsed.data.renewalDate,
    parsed.data.billingFrequency,
    parsed.data.customIntervalDays
  );

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      category_id: parsed.data.categoryId ?? null,
      name: parsed.data.name,
      logo_url: parsed.data.logoUrl || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency || "USD",
      billing_frequency: parsed.data.billingFrequency,
      custom_interval_days: parsed.data.customIntervalDays ?? null,
      start_date: parsed.data.startDate,
      renewal_date: parsed.data.renewalDate,
      next_billing_date: nextBilling,
      auto_renewal: parsed.data.autoRenewal,
      reminder_days: parsed.data.reminderDays,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to create subscription" };
  }

  revalidateSubscriptionPaths(data.id as string);
  return { success: true, data: { id: data.id as string } };
}

export async function updateSubscriptionAction(
  id: string,
  input: SubscriptionInput
): Promise<ActionResult> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid subscription",
    };
  }

  if (!isSupabaseConfigured()) {
    const updated = await updateDemoSubscription(id, parsed.data);
    if (!updated) return { success: false, error: "Subscription not found" };
    revalidateSubscriptionPaths(id);
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const updated = await updateDemoSubscription(id, parsed.data);
    if (!updated) return { success: false, error: "Subscription not found" };
    revalidateSubscriptionPaths(id);
    return { success: true };
  }

  const nextBilling = getNextBillingDate(
    parsed.data.renewalDate,
    parsed.data.billingFrequency,
    parsed.data.customIntervalDays
  );

  const { error } = await supabase
    .from("subscriptions")
    .update({
      category_id: parsed.data.categoryId ?? null,
      name: parsed.data.name,
      logo_url: parsed.data.logoUrl || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency || "USD",
      billing_frequency: parsed.data.billingFrequency,
      custom_interval_days: parsed.data.customIntervalDays ?? null,
      start_date: parsed.data.startDate,
      renewal_date: parsed.data.renewalDate,
      next_billing_date: nextBilling,
      auto_renewal: parsed.data.autoRenewal,
      reminder_days: parsed.data.reminderDays,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateSubscriptionPaths(id);
  return { success: true };
}

export async function deleteSubscriptionAction(
  id: string
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    await deleteDemoSubscription(id);
    revalidateSubscriptionPaths(id);
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await deleteDemoSubscription(id);
    revalidateSubscriptionPaths(id);
    return { success: true };
  }

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateSubscriptionPaths(id);
  return { success: true };
}

export async function updateSubscriptionStatusAction(
  id: string,
  status: "active" | "paused" | "cancelled"
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    const { getSubscription } = await import("./queries");
    const { item } = await getSubscription(id);
    if (!item) return { success: false, error: "Subscription not found" };
    await updateDemoSubscription(id, {
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
      status,
      notes: item.notes,
    });
    revalidateSubscriptionPaths(id);
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { getSubscription } = await import("./queries");
    const { item } = await getSubscription(id);
    if (!item) return { success: false, error: "Subscription not found" };
    await updateDemoSubscription(id, {
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
      status,
      notes: item.notes,
    });
    revalidateSubscriptionPaths(id);
    return { success: true };
  }

  const { error } = await supabase
    .from("subscriptions")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateSubscriptionPaths(id);
  return { success: true };
}
