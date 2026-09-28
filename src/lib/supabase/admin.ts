import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Same as createAdminClient, but returns null instead of throwing. */
export function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export const SERVICE_ROLE_MISSING_MESSAGE =
  "This server is missing SUPABASE_SERVICE_ROLE_KEY, so the change was not saved. Add that key in the Vercel project environment variables and redeploy.";

/** Service-role client, or a message safe to show in the UI. */
export function serviceRoleOrError() {
  const client = tryCreateAdminClient();
  if (!client) {
    return { ok: false as const, error: SERVICE_ROLE_MISSING_MESSAGE };
  }
  return { ok: true as const, client };
}
