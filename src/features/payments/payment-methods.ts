import { isSupabaseConfigured } from "@/lib/env";
import {
  readDemoPaymentMethods,
} from "@/lib/payments/payment-methods-store";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentMethod } from "@/types";

function normalizePaymentMethod(item: PaymentMethod): PaymentMethod {
  return {
    ...item,
    qr_image_url: item.qr_image_url ?? null,
  };
}

export async function listActivePaymentMethods() {
  if (!isSupabaseConfigured()) {
    const items = await readDemoPaymentMethods();
    return {
      items: items
        .filter((item) => item.is_active)
        .map(normalizePaymentMethod)
        .sort((a, b) => a.sort_order - b.sort_order),
      isDemo: true as const,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listActivePaymentMethods", error.message);
    return { items: [] as PaymentMethod[], isDemo: false as const };
  }

  return {
    items: ((data ?? []) as PaymentMethod[]).map(normalizePaymentMethod),
    isDemo: false as const,
  };
}

export async function listAllPaymentMethods() {
  if (!isSupabaseConfigured()) {
    const items = await readDemoPaymentMethods();
    return {
      items: [...items]
        .map(normalizePaymentMethod)
        .sort((a, b) => a.sort_order - b.sort_order),
      isDemo: true as const,
    };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("payment_methods")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return {
      items: ((data ?? []) as PaymentMethod[]).map(normalizePaymentMethod),
      isDemo: false as const,
    };
  } catch (error) {
    console.error("listAllPaymentMethods", error);
    return { items: [] as PaymentMethod[], isDemo: false as const };
  }
}
