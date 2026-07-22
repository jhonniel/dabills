import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

export type AdminSession = {
  userId: string;
  email: string;
  role: UserRole;
  isDemo: boolean;
};

/**
 * Ensures the current user can access admin routes.
 * Demo mode (no Supabase) grants admin for local preview.
 */
export async function requireAdmin(): Promise<AdminSession> {
  if (!isSupabaseConfigured()) {
    return {
      userId: "demo-admin",
      email: "admin@dabills.app",
      role: "admin",
      isDemo: true,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, email, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const profile = data as Pick<Profile, "id" | "email" | "role" | "full_name"> | null;

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard?error=admin_required");
  }

  return {
    userId: profile.id,
    email: profile.email,
    role: "admin",
    isDemo: false,
  };
}

export async function isCurrentUserAdmin() {
  if (!isSupabaseConfigured()) return true;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return (data as { role?: string } | null)?.role === "admin";
  } catch {
    return false;
  }
}

/** Soft demo flag to show admin link in user dashboard. */
export async function readDemoAdminEnabled() {
  if (!isSupabaseConfigured()) return true;
  const store = await cookies();
  return store.get("dabills_demo_admin")?.value === "1";
}
