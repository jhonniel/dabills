import type { AdminUser } from "@/lib/admin/demo-store";

export type UserSearchHasFilter = "code_name" | "subscriptions";

/**
 * Client/server shared filter: LIKE (contains, case-insensitive) + HAS flags.
 */
export function filterAdminUsers(
  users: AdminUser[],
  options: {
    like?: string;
    has?: UserSearchHasFilter[];
  }
): AdminUser[] {
  const like = options.like?.trim().toLowerCase() ?? "";
  const has = options.has ?? [];

  return users.filter((user) => {
    if (like) {
      const haystack = [
        user.full_name,
        user.email,
        user.code_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(like)) return false;
    }

    if (has.includes("code_name") && !user.code_name?.trim()) {
      return false;
    }

    if (
      has.includes("subscriptions") &&
      !(Number(user.subscriptions_count) > 0)
    ) {
      return false;
    }

    return true;
  });
}

export function normalizeCodeName(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, 64);
}
