export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      key !== "your-anon-key" &&
      !key.includes("your-anon")
  );
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
