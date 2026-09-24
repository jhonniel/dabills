import { DEMO_CATEGORIES } from "@/lib/billing/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { readDemoSubscriptionPlans } from "@/lib/subscriptions/plans-store";
import type { Category, SubscriptionPlan } from "@/types";
import type { ShowcasePlan } from "@/types/showcase";

export type { ShowcasePlan };

function domainFromLogoUrl(logoUrl: string | null | undefined) {
  if (!logoUrl) return "";
  try {
    const url = new URL(logoUrl, "http://local");
    return url.searchParams.get("domain") ?? "";
  } catch {
    return "";
  }
}

function toShowcase(
  plan: SubscriptionPlan,
  categoryName: string | null
): ShowcasePlan {
  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.amount),
    category: categoryName || "Subscription",
    domain: domainFromLogoUrl(plan.logo_url),
    logoUrl: plan.logo_url,
    billingFrequency: plan.billing_frequency,
  };
}

async function categoryMapFromDemo() {
  return new Map(DEMO_CATEGORIES.map((c) => [c.id, c.name]));
}

async function categoryMapFromDb() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("categories").select("id, name");
    return new Map(
      ((data ?? []) as Pick<Category, "id" | "name">[]).map((c) => [
        c.id,
        c.name,
      ])
    );
  } catch {
    return categoryMapFromDemo();
  }
}

/** Active subscription plans for the marketing landing (same catalog as admin). */
export async function listPublicShowcasePlans(): Promise<ShowcasePlan[]> {
  if (!isSupabaseConfigured()) {
    const plans = await readDemoSubscriptionPlans();
    const categories = await categoryMapFromDemo();
    return plans
      .filter((p) => p.status === "active")
      .map((p) => toShowcase(p, p.category_id ? categories.get(p.category_id) ?? null : null));
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("subscription_plans")
      .select("*")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error || !data) {
      console.warn("listPublicShowcasePlans", error?.message);
      return [];
    }

    const categories = await categoryMapFromDb();
    return (data as SubscriptionPlan[]).map((p) =>
      toShowcase(p, p.category_id ? categories.get(p.category_id) ?? null : null)
    );
  } catch (error) {
    console.warn("listPublicShowcasePlans", error);
    return [];
  }
}
