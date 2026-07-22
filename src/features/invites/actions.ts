"use server";

import { isSupabaseConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { InviteCode, Profile } from "@/types";
import { validateInviteSchema } from "@/validators/invite";

export type InviteValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export async function validateInviteCodeAction(
  code: string
): Promise<InviteValidationResult> {
  if (!isSupabaseConfigured()) {
    if (code.trim().toUpperCase() === "DABILLS-DEMO") {
      return { valid: true };
    }
    return {
      valid: false,
      error:
        "Supabase is not configured. Use invite code DABILLS-DEMO for UI preview.",
    };
  }

  const parsed = validateInviteSchema.safeParse({ code });
  if (!parsed.success) {
    return { valid: false, error: "Invite code is invalid." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .select("id, is_active, expires_at, max_uses, uses_count")
    .ilike("code", parsed.data.code)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: "Invite code not found." };
  }

  const invite = data as Pick<
    InviteCode,
    "id" | "is_active" | "expires_at" | "max_uses" | "uses_count"
  >;

  if (!invite.is_active) {
    return { valid: false, error: "This invite code has been disabled." };
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { valid: false, error: "This invite code has expired." };
  }

  if (invite.max_uses !== null && invite.uses_count >= invite.max_uses) {
    return {
      valid: false,
      error: "This invite code has reached its usage limit.",
    };
  }

  return { valid: true };
}

export async function createInviteCodeAction(input: {
  code: string;
  maxUses?: number | null;
  expiresAt?: string | null;
  note?: string | null;
}) {
  if (!isSupabaseConfigured()) {
    return { success: false as const, error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Unauthorized." };
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const profile = profileData as Pick<Profile, "role"> | null;

  if (profile?.role !== "admin") {
    return { success: false as const, error: "Admin access required." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .insert({
      code: input.code.trim().toUpperCase(),
      max_uses: input.maxUses ?? null,
      expires_at: input.expiresAt ?? null,
      note: input.note ?? null,
      created_by: user.id,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, data: data as InviteCode };
}
