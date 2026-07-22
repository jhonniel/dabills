import { isSupabaseConfigured } from "@/lib/env";
import { getDemoCategories } from "@/lib/billing/demo-store";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export async function listCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return getDemoCategories();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listCategories", error.message);
    return getDemoCategories();
  }

  return (data ?? []) as Category[];
}
