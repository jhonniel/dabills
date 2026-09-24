import { isSupabaseConfigured } from "@/lib/env";
import { readDemoSubscriptions } from "@/lib/billing/demo-store";
import type { SubscriptionWithCategory } from "@/lib/billing/demo-data";
import { createClient } from "@/lib/supabase/server";
import {
  subscriptionFiltersSchema,
  type SubscriptionFilters,
} from "@/validators/subscription";

export type { SubscriptionWithCategory };

function applyFilters(
  items: SubscriptionWithCategory[],
  filters: SubscriptionFilters
) {
  let result = [...items];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q) ||
        item.category?.name.toLowerCase().includes(q)
    );
  }

  if (filters.status && filters.status !== "all") {
    result = result.filter((item) => item.status === filters.status);
  }

  if (filters.categoryId && filters.categoryId !== "all") {
    result = result.filter((item) => item.category_id === filters.categoryId);
  }

  switch (filters.sort) {
    case "name_asc":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name_desc":
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "amount_asc":
      result.sort((a, b) => a.amount - b.amount);
      break;
    case "amount_desc":
      result.sort((a, b) => b.amount - a.amount);
      break;
    case "renewal_asc":
      result.sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date));
      break;
    case "renewal_desc":
      result.sort((a, b) => b.next_billing_date.localeCompare(a.next_billing_date));
      break;
    case "created_desc":
    default:
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
  }

  return result;
}

export async function listSubscriptions(filters: SubscriptionFilters = {}) {
  const parsed = subscriptionFiltersSchema.parse(filters);

  if (!isSupabaseConfigured()) {
    const items = applyFilters(await readDemoSubscriptions(), parsed);
    return { items, isDemo: true as const };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { items: [] as SubscriptionWithCategory[], isDemo: false as const };
  }

  let query = supabase
    .from("subscriptions")
    .select("*, category:categories(id, slug, name, icon, color)")
    .eq("user_id", user.id);

  if (parsed.status && parsed.status !== "all") {
    query = query.eq("status", parsed.status);
  }

  if (parsed.categoryId && parsed.categoryId !== "all") {
    query = query.eq("category_id", parsed.categoryId);
  }

  if (parsed.search) {
    query = query.ilike("name", `%${parsed.search}%`);
  }

  switch (parsed.sort) {
    case "name_asc":
      query = query.order("name", { ascending: true });
      break;
    case "name_desc":
      query = query.order("name", { ascending: false });
      break;
    case "amount_asc":
      query = query.order("amount", { ascending: true });
      break;
    case "amount_desc":
      query = query.order("amount", { ascending: false });
      break;
    case "renewal_asc":
      query = query.order("next_billing_date", { ascending: true });
      break;
    case "renewal_desc":
      query = query.order("next_billing_date", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("listSubscriptions", error.message);
    return { items: [] as SubscriptionWithCategory[], isDemo: false as const };
  }

  const items = (data ?? []).map((row) => {
    const record = row as SubscriptionWithCategory & {
      category?: SubscriptionWithCategory["category"] | SubscriptionWithCategory["category"][];
    };
    const category = Array.isArray(record.category)
      ? record.category[0] ?? null
      : record.category ?? null;
    return { ...record, category };
  });

  return { items, isDemo: false as const };
}

export async function getSubscription(id: string) {
  if (!isSupabaseConfigured()) {
    const items = await readDemoSubscriptions();
    return {
      item: items.find((item) => item.id === id) ?? null,
      isDemo: true as const,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { item: null, isDemo: false as const };
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, category:categories(id, slug, name, icon, color)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return { item: null, isDemo: false as const };
  }

  const record = data as SubscriptionWithCategory & {
    category?: SubscriptionWithCategory["category"] | SubscriptionWithCategory["category"][];
  };
  const category = Array.isArray(record.category)
    ? record.category[0] ?? null
    : record.category ?? null;

  return { item: { ...record, category }, isDemo: false as const };
}
