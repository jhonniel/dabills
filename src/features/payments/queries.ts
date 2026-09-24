import { isSupabaseConfigured } from "@/lib/env";
import { readDemoPayments, type DemoPaymentRecord } from "@/lib/payments/demo-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  paymentFiltersSchema,
  type PaymentFilters,
} from "@/validators/payment";

export type PaymentListItem = DemoPaymentRecord;

function applyFilters(items: PaymentListItem[], filters: PaymentFilters) {
  let result = [...items];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.subscription_name?.toLowerCase().includes(q) ||
        item.reference_number?.toLowerCase().includes(q) ||
        item.merchant?.toLowerCase().includes(q) ||
        item.status.includes(q)
    );
  }

  if (filters.status && filters.status !== "all") {
    result = result.filter((item) => item.status === filters.status);
  }

  return result.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function mapPaymentRows(data: Array<Record<string, unknown>>): PaymentListItem[] {
  return data.map((row) => {
    const receipts = row.receipt as
      | PaymentListItem["receipt"][]
      | PaymentListItem["receipt"];
    const receipt = Array.isArray(receipts)
      ? (receipts[0] ?? null)
      : (receipts ?? null);
    const billingCycle = row.billing_cycle as
      | {
          due_date?: string;
          subscription?: { name?: string } | Array<{ name?: string }>;
        }
      | null;
    const subscription = Array.isArray(billingCycle?.subscription)
      ? billingCycle?.subscription[0]
      : billingCycle?.subscription;

    return {
      ...((row as unknown) as PaymentListItem),
      receipt,
      due_date: billingCycle?.due_date ?? null,
      subscription_name: subscription?.name ?? null,
      validation: null,
    } satisfies PaymentListItem;
  });
}

export async function listPayments(filters: PaymentFilters = {}) {
  const parsed = paymentFiltersSchema.parse(filters);

  if (!isSupabaseConfigured()) {
    const items = applyFilters(await readDemoPayments(), parsed);
    return { items, isDemo: true as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [] as PaymentListItem[], isDemo: false as const };
  }

  const { data, error } = await supabase
    .from("payments")
    .select(
      "*, receipt:payment_receipts(*), billing_cycle:billing_cycles(due_date, subscription:subscriptions(name))"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listPayments", error.message);
    return { items: [] as PaymentListItem[], isDemo: false as const };
  }

  return {
    items: applyFilters(
      mapPaymentRows((data ?? []) as Array<Record<string, unknown>>),
      parsed
    ),
    isDemo: false as const,
  };
}

/** Admin: all users' payments (service role). */
export async function listAllPaymentsForAdmin(filters: PaymentFilters = {}) {
  const parsed = paymentFiltersSchema.parse(filters);

  if (!isSupabaseConfigured()) {
    const items = applyFilters(await readDemoPayments(), parsed);
    return { items, isDemo: true as const };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("payments")
      .select(
        "*, receipt:payment_receipts(*), billing_cycle:billing_cycles(due_date, subscription:subscriptions(name))"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      items: applyFilters(
        mapPaymentRows((data ?? []) as Array<Record<string, unknown>>),
        parsed
      ),
      isDemo: false as const,
    };
  } catch (error) {
    console.error("listAllPaymentsForAdmin", error);
    return { items: [] as PaymentListItem[], isDemo: false as const };
  }
}

export async function getPayment(id: string) {
  const { items, isDemo } = await listPayments({ status: "all" });
  return { item: items.find((item) => item.id === id) ?? null, isDemo };
}

export async function getPaymentsOverview() {
  const { items, isDemo } = await listPayments({ status: "all" });
  return {
    isDemo,
    total: items.length,
    pendingVerification: items.filter((i) => i.status === "pending_verification")
      .length,
    approved: items.filter((i) => i.status === "approved").length,
    rejected: items.filter((i) => i.status === "rejected").length,
    totalPaid: items
      .filter((i) => i.status === "approved")
      .reduce((sum, i) => sum + Number(i.amount), 0),
  };
}
