"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/lib/env";
import { updateDemoBillStatus } from "@/lib/billing/demo-bills";
import { readDemoBillingCycles } from "@/lib/billing/demo-bills";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import {
  createDemoPayment,
  updateDemoPayment,
  type DemoPaymentRecord,
} from "@/lib/payments/demo-store";
import { storeReceipt } from "@/lib/payments/storage";
import { enforceMutationGuard } from "@/lib/security/guards";
import { sanitizePlainText } from "@/lib/security/request";
import { runOcrExtraction } from "@/services/ocr/provider";
import { validateOcrAgainstBill } from "@/services/ocr/validate";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle, Payment, PaymentReceipt } from "@/types";
import { settleBillSchema } from "@/validators/payment";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function revalidatePaymentPaths(billingCycleId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  revalidatePath("/dashboard/payments");
  if (billingCycleId) {
    revalidatePath(`/dashboard/billing/${billingCycleId}/pay`);
  }
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function settleBillAction(formData: FormData): Promise<
  ActionResult<{
    paymentId: string;
    status: Payment["status"];
    validation: ReturnType<typeof validateOcrAgainstBill>;
    extraction: {
      merchant: string | null;
      amount: number | null;
      referenceNumber: string | null;
      date: string | null;
      confidence: number;
      provider: string;
    };
  }>
> {
  const guard = await enforceMutationGuard({
    action: "payments:settle",
    limit: 15,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const parsed = settleBillSchema.safeParse({
    billingCycleId: formData.get("billingCycleId"),
    referenceNumber: formData.get("referenceNumber")
      ? sanitizePlainText(String(formData.get("referenceNumber")), 120)
      : undefined,
    notes: formData.get("notes")
      ? sanitizePlainText(String(formData.get("notes")), 2000)
      : undefined,
    forceMismatch: formData.get("forceMismatch") === "true",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid payment input",
    };
  }

  const receiptFile = formData.get("receipt");
  if (!(receiptFile instanceof File) || receiptFile.size === 0) {
    return { success: false, error: "Please upload a receipt image" };
  }

  if (!receiptFile.type.startsWith("image/")) {
    return { success: false, error: "Receipt must be an image file" };
  }

  if (receiptFile.size > 8 * 1024 * 1024) {
    return { success: false, error: "Receipt must be under 8MB" };
  }

  const bytes = await fileToBuffer(receiptFile);
  const now = new Date().toISOString();

  // Resolve bill + subscription (demo or supabase)
  let bill: BillingCycle | null = null;
  let merchantName: string | null = null;
  let userId = "demo-user";

  if (!isSupabaseConfigured()) {
    const [cycles, subscriptions] = await Promise.all([
      readDemoBillingCycles(),
      readDemoSubscriptions(),
    ]);
    bill = cycles.find((cycle) => cycle.id === parsed.data.billingCycleId) ?? null;
    const subscription = subscriptions.find((sub) => sub.id === bill?.subscription_id);
    merchantName = subscription?.name ?? null;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const [cycles, subscriptions] = await Promise.all([
        readDemoBillingCycles(),
        readDemoSubscriptions(),
      ]);
      bill = cycles.find((cycle) => cycle.id === parsed.data.billingCycleId) ?? null;
      const subscription = subscriptions.find((sub) => sub.id === bill?.subscription_id);
      merchantName = subscription?.name ?? null;
    } else {
      userId = user.id;
      const { data } = await supabase
        .from("billing_cycles")
        .select("*, subscription:subscriptions(name)")
        .eq("id", parsed.data.billingCycleId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        bill = data as BillingCycle;
        const sub = (data as { subscription?: { name?: string } | Array<{ name?: string }> })
          .subscription;
        merchantName = Array.isArray(sub) ? sub[0]?.name ?? null : sub?.name ?? null;
      }
    }
  }

  if (!bill) {
    return { success: false, error: "Billing cycle not found" };
  }

  if (bill.status === "paid" || bill.status === "pending_verification") {
    return {
      success: false,
      error: "This bill is already paid or awaiting verification",
    };
  }

  const paymentId = crypto.randomUUID();
  const stored = await storeReceipt({
    userId,
    paymentId,
    fileName: receiptFile.name,
    mimeType: receiptFile.type,
    bytes,
  });

  const extraction = await runOcrExtraction(bytes, receiptFile.type, {
    expectedAmount: Number(bill.amount),
    expectedMerchant: merchantName ?? undefined,
    expectedDate: bill.due_date,
    forceMismatch: parsed.data.forceMismatch,
  });

  const validation = validateOcrAgainstBill(extraction, {
    amount: Number(bill.amount),
    dueDate: bill.due_date,
    merchant: merchantName,
    currency: bill.currency,
  });

  const paymentStatus: Payment["status"] = validation.overallMatch
    ? "approved"
    : "pending_verification";

  const billStatus = validation.overallMatch ? "paid" : "pending_verification";
  const paidAt = validation.overallMatch ? now : null;

  const reference =
    parsed.data.referenceNumber || extraction.referenceNumber || null;

  const payment: DemoPaymentRecord = {
    id: paymentId,
    billing_cycle_id: bill.id,
    user_id: userId,
    amount: Number(bill.amount),
    currency: bill.currency,
    status: paymentStatus,
    reference_number: reference,
    merchant: extraction.merchant,
    paid_at: paidAt,
    reviewed_by: null,
    reviewed_at: validation.overallMatch ? now : null,
    rejection_reason: null,
    notes: parsed.data.notes ?? null,
    created_at: now,
    updated_at: now,
    subscription_name: merchantName,
    due_date: bill.due_date,
    validation,
    receipt: {
      id: crypto.randomUUID(),
      payment_id: paymentId,
      user_id: userId,
      storage_path: stored.storagePath,
      file_name: stored.fileName,
      mime_type: stored.mimeType,
      file_size: stored.fileSize,
      ocr_provider: extraction.provider,
      ocr_raw: extraction.raw,
      extracted_amount: extraction.amount,
      extracted_reference: extraction.referenceNumber,
      extracted_date: extraction.date,
      extracted_merchant: extraction.merchant,
      confidence: extraction.confidence,
      amount_match: validation.amountMatch,
      created_at: now,
    } satisfies PaymentReceipt,
  };

  if (!isSupabaseConfigured() || userId === "demo-user") {
    await createDemoPayment(payment);
    await updateDemoBillStatus(bill.id, billStatus);
  } else {
    const supabase = await createClient();
    const { error: paymentError } = await supabase.from("payments").insert({
      id: paymentId,
      billing_cycle_id: bill.id,
      user_id: userId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      reference_number: payment.reference_number,
      merchant: payment.merchant,
      notes: payment.notes,
      paid_at: paidAt,
      reviewed_at: validation.overallMatch ? now : null,
    });

    if (paymentError) {
      return { success: false, error: paymentError.message };
    }

    if (payment.receipt) {
      await supabase.from("payment_receipts").insert({
        id: payment.receipt.id,
        payment_id: paymentId,
        user_id: userId,
        storage_path: payment.receipt.storage_path,
        file_name: payment.receipt.file_name,
        mime_type: payment.receipt.mime_type,
        file_size: payment.receipt.file_size,
        ocr_provider: payment.receipt.ocr_provider,
        ocr_raw: payment.receipt.ocr_raw,
        extracted_amount: payment.receipt.extracted_amount,
        extracted_reference: payment.receipt.extracted_reference,
        extracted_date: payment.receipt.extracted_date,
        extracted_merchant: payment.receipt.extracted_merchant,
        confidence: payment.receipt.confidence,
        amount_match: payment.receipt.amount_match,
      });
    }

    await supabase
      .from("billing_cycles")
      .update({
        status: billStatus,
        paid_at: paidAt,
      })
      .eq("id", bill.id)
      .eq("user_id", userId);

    // Keep a demo copy for history UI richness in mixed setups
    await createDemoPayment(payment);
  }

  revalidatePaymentPaths(bill.id);
  revalidatePath("/admin/payments");

  try {
    const {
      notifyPaymentReceivedAction,
      notifyPaymentApprovedAction,
    } = await import("@/features/notifications/actions");
    await notifyPaymentReceivedAction({
      userId,
      email: userId === "demo-user" ? "demo@dabills.app" : undefined,
      subscriptionName: merchantName ?? "Subscription",
      amount: Number(bill.amount),
      currency: bill.currency,
      reference,
    });
    if (validation.overallMatch) {
      await notifyPaymentApprovedAction({
        userId,
        email: userId === "demo-user" ? "demo@dabills.app" : undefined,
        subscriptionName: merchantName ?? "Subscription",
        amount: Number(bill.amount),
        currency: bill.currency,
      });
    }
  } catch (error) {
    console.error("payment notifications", error);
  }

  return {
    success: true,
    data: {
      paymentId,
      status: paymentStatus,
      validation,
      extraction: {
        merchant: extraction.merchant,
        amount: extraction.amount,
        referenceNumber: extraction.referenceNumber,
        date: extraction.date,
        confidence: extraction.confidence,
        provider: extraction.provider,
      },
    },
  };
}

async function maybeNotifyPaymentDecision(payment: {
  user_id: string;
  amount: number;
  currency: string;
  subscription_name?: string | null;
  status: string;
}) {
  if (payment.status !== "approved") return;
  try {
    const { notifyPaymentApprovedAction } = await import(
      "@/features/notifications/actions"
    );
    await notifyPaymentApprovedAction({
      userId: payment.user_id,
      email: payment.user_id === "demo-user" ? "demo@dabills.app" : undefined,
      subscriptionName: payment.subscription_name ?? "Subscription",
      amount: Number(payment.amount),
      currency: payment.currency,
    });
  } catch (error) {
    console.error("notifyPaymentApprovedAction", error);
  }
}

export async function reviewPaymentAction(input: {
  paymentId: string;
  decision: "approved" | "rejected";
  rejectionReason?: string;
}): Promise<ActionResult> {
  const guard = await enforceMutationGuard({
    action: "payments:review",
    limit: 30,
    windowMs: 60_000,
  });
  if (!guard.ok) return { success: false, error: guard.error };

  const now = new Date().toISOString();
  const rejectionReason = input.rejectionReason
    ? sanitizePlainText(input.rejectionReason, 500)
    : undefined;

  if (!isSupabaseConfigured()) {
    const updated = await updateDemoPayment(input.paymentId, {
      status: input.decision,
      reviewed_at: now,
      rejection_reason:
        input.decision === "rejected" ? rejectionReason ?? "Rejected" : null,
      paid_at: input.decision === "approved" ? now : null,
    });

    if (!updated) return { success: false, error: "Payment not found" };

    if (input.decision === "approved") {
      await updateDemoBillStatus(updated.billing_cycle_id, "paid");
      await maybeNotifyPaymentDecision(updated);
    }

    revalidatePaymentPaths(updated.billing_cycle_id);
    return { success: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const updated = await updateDemoPayment(input.paymentId, {
      status: input.decision,
      reviewed_at: now,
      rejection_reason:
        input.decision === "rejected" ? rejectionReason ?? "Rejected" : null,
      paid_at: input.decision === "approved" ? now : null,
    });
    if (!updated) return { success: false, error: "Payment not found" };
    if (input.decision === "approved") {
      await updateDemoBillStatus(updated.billing_cycle_id, "paid");
      await maybeNotifyPaymentDecision(updated);
    }
    revalidatePaymentPaths(updated.billing_cycle_id);
    return { success: true };
  }

  const { data: payment, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", input.paymentId)
    .maybeSingle();

  if (error || !payment) {
    return { success: false, error: error?.message ?? "Payment not found" };
  }

  const { error: updateError } = await supabase
    .from("payments")
    .update({
      status: input.decision,
      reviewed_by: user.id,
      reviewed_at: now,
      rejection_reason:
        input.decision === "rejected" ? rejectionReason ?? "Rejected" : null,
      paid_at: input.decision === "approved" ? now : null,
    })
    .eq("id", input.paymentId);

  if (updateError) return { success: false, error: updateError.message };

  if (input.decision === "approved") {
    await supabase
      .from("billing_cycles")
      .update({ status: "paid", paid_at: now })
      .eq("id", (payment as Payment).billing_cycle_id);

    await maybeNotifyPaymentDecision({
      user_id: (payment as Payment).user_id,
      amount: Number((payment as Payment).amount),
      currency: (payment as Payment).currency,
      subscription_name: (payment as Payment).merchant,
      status: "approved",
    });
  }

  await updateDemoPayment(input.paymentId, {
    status: input.decision,
    reviewed_at: now,
    paid_at: input.decision === "approved" ? now : null,
  });

  revalidatePaymentPaths((payment as Payment).billing_cycle_id);
  return { success: true };
}
