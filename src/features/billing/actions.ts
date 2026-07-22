"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import {
  generateDemoBillingCycles,
  refreshDemoBillStatuses,
  updateDemoBillStatus,
} from "@/lib/billing/demo-bills";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import {
  generateBillingCyclesForSubscription,
  refreshBillingCycleStatuses,
  type SubscriptionLike,
} from "@/lib/billing/engine";
import { buildReminderSchedule } from "@/lib/billing/reminders";
import { createClient } from "@/lib/supabase/server";
import type { BillStatus, BillingCycle } from "@/types";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function revalidateBillingPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard/payments");
}

export async function generateUpcomingBillsAction(options?: {
  horizonDays?: number;
  maxCycles?: number;
}): Promise<ActionResult<{ created: number; total: number }>> {
  if (!isSupabaseConfigured()) {
    const result = await generateDemoBillingCycles(options);
    revalidateBillingPaths();
    return {
      success: true,
      data: { created: result.created, total: result.total },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const result = await generateDemoBillingCycles(options);
    revalidateBillingPaths();
    return {
      success: true,
      data: { created: result.created, total: result.total },
    };
  }

  const [{ data: subscriptions }, { data: existing }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active"),
    supabase.from("billing_cycles").select("*").eq("user_id", user.id),
  ]);

  const existingCycles = (existing ?? []) as BillingCycle[];
  const drafts: Array<Omit<BillingCycle, "id" | "created_at" | "updated_at">> =
    [];

  for (const subscription of (subscriptions ?? []) as SubscriptionLike[]) {
    drafts.push(
      ...generateBillingCyclesForSubscription(subscription, existingCycles, options)
    );
  }

  if (drafts.length === 0) {
    return { success: true, data: { created: 0, total: existingCycles.length } };
  }

  const { data, error } = await supabase
    .from("billing_cycles")
    .insert(drafts)
    .select("id");

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateBillingPaths();
  return {
    success: true,
    data: {
      created: data?.length ?? drafts.length,
      total: existingCycles.length + (data?.length ?? drafts.length),
    },
  };
}

export async function refreshBillStatusesAction(): Promise<
  ActionResult<{ updated: number }>
> {
  if (!isSupabaseConfigured()) {
    const next = await refreshDemoBillStatuses();
    revalidateBillingPaths();
    return { success: true, data: { updated: next.length } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = await refreshDemoBillStatuses();
    revalidateBillingPaths();
    return { success: true, data: { updated: next.length } };
  }

  const { data: existing, error } = await supabase
    .from("billing_cycles")
    .select("*")
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  const refreshed = refreshBillingCycleStatuses((existing ?? []) as BillingCycle[]);
  let updated = 0;

  for (const cycle of refreshed) {
    const original = (existing ?? []).find((row) => row.id === cycle.id) as
      | BillingCycle
      | undefined;
    if (!original || original.status === cycle.status) continue;

    const { error: updateError } = await supabase
      .from("billing_cycles")
      .update({ status: cycle.status, updated_at: cycle.updated_at })
      .eq("id", cycle.id)
      .eq("user_id", user.id);

    if (!updateError) updated += 1;
  }

  revalidateBillingPaths();
  return { success: true, data: { updated } };
}

export async function updateBillStatusAction(
  id: string,
  status: BillStatus
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    const updated = await updateDemoBillStatus(id, status);
    if (!updated) return { success: false, error: "Bill not found" };
    revalidateBillingPaths();
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const updated = await updateDemoBillStatus(id, status);
    if (!updated) return { success: false, error: "Bill not found" };
    revalidateBillingPaths();
    return { success: true };
  }

  const { error } = await supabase
    .from("billing_cycles")
    .update({
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };

  revalidateBillingPaths();
  return { success: true };
}

export async function getScheduledRemindersAction() {
  if (!isSupabaseConfigured()) {
    const [cycles, subscriptions] = await Promise.all([
      (await import("@/lib/billing/demo-bills")).readDemoBillingCycles(),
      readDemoSubscriptions(),
    ]);
    return {
      success: true as const,
      data: buildReminderSchedule({ cycles, subscriptions }),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const [cycles, subscriptions] = await Promise.all([
      (await import("@/lib/billing/demo-bills")).readDemoBillingCycles(),
      readDemoSubscriptions(),
    ]);
    return {
      success: true as const,
      data: buildReminderSchedule({ cycles, subscriptions }),
    };
  }

  const [{ data: cycles }, { data: subscriptions }] = await Promise.all([
    supabase.from("billing_cycles").select("*").eq("user_id", user.id),
    supabase
      .from("subscriptions")
      .select("id, user_id, reminder_days, status")
      .eq("user_id", user.id),
  ]);

  return {
    success: true as const,
    data: buildReminderSchedule({
      cycles: (cycles ?? []) as BillingCycle[],
      subscriptions: (subscriptions ?? []) as Array<{
        id: string;
        user_id: string;
        reminder_days: number[];
        status: "active" | "paused" | "cancelled";
      }>,
    }),
  };
}
