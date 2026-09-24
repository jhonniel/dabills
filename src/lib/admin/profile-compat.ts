import type { SupabaseClient } from "@supabase/supabase-js";

import { isPlaceholderEmail } from "@/lib/admin/pending-email";

type ProfilePatch = {
  full_name?: string | null;
  email?: string | null;
  account_status?: "pending" | "active" | "disabled";
  code_name?: string | null;
};

/**
 * Update profiles with graceful fallback when migrations 010/012 are not applied yet
 * (missing account_status / non-null email).
 */
export async function updateProfileCompat(
  admin: SupabaseClient,
  userId: string,
  patch: ProfilePatch
): Promise<{ error: string | null }> {
  const attempts: ProfilePatch[] = [patch];

  // Drop account_status if the column is missing on older databases
  if (patch.account_status !== undefined) {
    const { account_status: _status, ...withoutStatus } = patch;
    attempts.push(withoutStatus);
  }

  // Avoid writing null email when the column is still NOT NULL
  if (patch.email === null) {
    const { email: _email, ...withoutNullEmail } = patch;
    attempts.push(withoutNullEmail);
    if (patch.account_status !== undefined) {
      const { account_status: _status, email: _email2, ...bare } = patch;
      attempts.push(bare);
    }
  }

  let lastError: string | null = null;
  for (const body of attempts) {
    if (Object.keys(body).length === 0) continue;
    const { error } = await admin.from("profiles").update(body).eq("id", userId);
    if (!error) return { error: null };
    lastError = error.message;
    // Retry on known schema-cache / nullability issues
    if (
      !/account_status|null value|not-null|schema cache/i.test(error.message)
    ) {
      return { error: lastError };
    }
  }

  return { error: lastError };
}

export function profileEmailForDisplay(email: string | null | undefined) {
  if (isPlaceholderEmail(email)) return null;
  return email?.trim() || null;
}
