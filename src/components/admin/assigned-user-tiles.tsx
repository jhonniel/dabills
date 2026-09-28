"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { UserAssignmentsEditor } from "@/components/admin/user-assignment-dates";
import type { AssignedSubscription } from "@/features/admin/queries";
import type { AdminUser } from "@/lib/admin/demo-store";
import { displayUserEmail } from "@/lib/admin/pending-email";
import { filterAdminUsers } from "@/lib/admin/user-search";
import { Input } from "@/components/ui/input";

export function AssignedUserTiles({
  users,
  assigned,
}: {
  users: AdminUser[];
  assigned: AssignedSubscription[];
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => filterAdminUsers(users, { like: query }),
    [users, query]
  );
  const byUser = useMemo(() => {
    const grouped = new Map<string, AssignedSubscription[]>();
    for (const item of assigned) {
      const list = grouped.get(item.user_id) ?? [];
      list.push(item);
      grouped.set(item.user_id, list);
    }
    return grouped;
  }, [assigned]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Assigned to each user
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search a user, then change their start date or next billing date.
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, or code"
            aria-label="Search users"
            className="h-10 pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-muted-foreground">
          No users match this search.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((user) => {
            const items = byUser.get(user.id) ?? [];
            return (
              <article
                key={user.id}
                id={`user-${user.id}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-medium">
                    {user.full_name ?? "Unnamed"}
                  </h3>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayUserEmail(user.email)}
                  </p>
                  {user.code_name && (
                    <p className="mt-1 font-mono text-xs text-cyan-300">
                      {user.code_name}
                    </p>
                  )}
                </div>
                <div className="mt-4">
                  <UserAssignmentsEditor items={items} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
