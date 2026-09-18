export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      key !== "your-anon-key" &&
      !key.includes("your-anon")
  );
}

/** User-facing message when Supabase env vars are missing. */
export function supabaseMissingMessage() {
  if (process.env.VERCEL) {
    return "Supabase is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in the Vercel project Environment Variables, then redeploy.";
  }
  return "Supabase is not configured. Add your project credentials to .env.local.";
}

function normalizeAppUrl(value: string | undefined | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    // Accept host-only values from VERCEL_URL
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

/** Canonical app origin for metadata, emails, and activation links. */
export function getAppUrl() {
  return (
    normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeAppUrl(process.env.VERCEL_URL) ??
    "http://localhost:3000"
  );
}
