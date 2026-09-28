"use server";

import type { SubscriptionInput } from "@/validators/subscription";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

const VIEW_ONLY_ERROR =
  "Only an admin can assign subscriptions. You can view the ones assigned to you.";

export async function createSubscriptionAction(
  input: SubscriptionInput
): Promise<ActionResult<{ id: string }>> {
  void input;
  return { success: false, error: VIEW_ONLY_ERROR };
}

export async function updateSubscriptionAction(
  id: string,
  input: SubscriptionInput
): Promise<ActionResult> {
  void id;
  void input;
  return { success: false, error: VIEW_ONLY_ERROR };
}

export async function deleteSubscriptionAction(
  id: string
): Promise<ActionResult> {
  void id;
  return { success: false, error: VIEW_ONLY_ERROR };
}

export async function updateSubscriptionStatusAction(
  id: string,
  status: "active" | "paused" | "cancelled"
): Promise<ActionResult> {
  void id;
  void status;
  return { success: false, error: VIEW_ONLY_ERROR };
}
