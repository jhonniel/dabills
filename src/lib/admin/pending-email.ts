/** Temporary Auth email until admin attaches a real claim address */
export const PENDING_EMAIL_DOMAIN = "dabills.pending";

export function pendingAuthEmail(seed = crypto.randomUUID()) {
  return `pending.${seed.replace(/-/g, "")}@${PENDING_EMAIL_DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined) {
  if (!email?.trim()) return true;
  return email.trim().toLowerCase().endsWith(`@${PENDING_EMAIL_DOMAIN}`);
}

export function displayUserEmail(email: string | null | undefined) {
  if (isPlaceholderEmail(email)) return "No email yet";
  return email!.trim();
}

export function normalizeClaimEmail(email: string | null | undefined) {
  const value = email?.trim().toLowerCase() ?? "";
  if (!value) return null;
  return value;
}
