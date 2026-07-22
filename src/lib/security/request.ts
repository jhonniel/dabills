import { headers } from "next/headers";

import { getAppUrl } from "@/lib/env";

/**
 * Soft CSRF / origin check for mutating server actions.
 * Allows same-origin requests and configured APP_URL.
 */
export async function assertSameOrigin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const referer = headerStore.get("referer");
  const host = headerStore.get("host");
  const appUrl = getAppUrl();

  // Server-to-server / cron may omit Origin
  if (!origin && !referer) {
    return { ok: true };
  }

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(appUrl).origin);
  } catch {
    // ignore invalid app url
  }
  if (host) {
    allowed.add(`https://${host}`);
    allowed.add(`http://${host}`);
  }

  const candidate = origin ?? (referer ? safeOrigin(referer) : null);
  if (!candidate) {
    return { ok: false, error: "Missing request origin." };
  }

  if (![...allowed].some((value) => value === candidate)) {
    return { ok: false, error: "Invalid request origin." };
  }

  return { ok: true };
}

function safeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Escape text for safe HTML email interpolation. */
export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function sanitizePlainText(value: string, maxLength = 2000) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").slice(0, maxLength);
}
