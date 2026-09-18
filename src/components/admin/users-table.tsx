"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  adminToggleUserStatusAction,
  adminUpdateUserRoleAction,
} from "@/features/admin/actions";
import type { AdminUser } from "@/lib/admin/demo-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function UserActions({
  user,
  pending,
  onRole,
  onStatus,
}: {
  user: AdminUser;
  pending: boolean;
  onRole: () => void;
  onStatus: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      <Button
        size="sm"
        variant="outline"
        className="rounded-lg"
        disabled={pending || user.role === "admin"}
        onClick={onRole}
      >
        Make {user.role === "admin" ? "user" : "admin"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="rounded-lg"
        disabled={pending || user.role === "admin"}
        onClick={onStatus}
      >
        {user.status === "disabled" ? "Enable" : "Disable"}
      </Button>
    </div>
  );
}

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const changeRole = (user: AdminUser) => {
    startTransition(async () => {
      const nextRole = user.role === "admin" ? "user" : "admin";
      const result = await adminUpdateUserRoleAction(user.id, nextRole);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Role updated to ${nextRole}`);
      router.refresh();
    });
  };

  const changeStatus = (user: AdminUser) => {
    startTransition(async () => {
      const next = user.status === "disabled" ? "active" : "disabled";
      const result = await adminToggleUserStatusAction(user.id, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`User ${next}`);
      router.refresh();
    });
  };

  return (
    <>
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div
            key={user.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{user.full_name ?? "Unnamed"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    user.status === "disabled"
                      ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                      : "border-teal-400/30 bg-teal-400/10 text-teal-200"
                  }
                >
                  {user.status ?? "active"}
                </Badge>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {user.subscriptions_count ?? 0} subscriptions
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-lg">
                <Link href={`/admin/subscriptions/assign?userId=${user.id}`}>
                  Assign seat
                </Link>
              </Button>
              <UserActions
                user={user}
                pending={pending}
                onRole={() => changeRole(user)}
                onStatus={() => changeStatus(user)}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscriptions</TableHead>
              <TableHead className="w-56" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-white/10">
                <TableCell>
                  <p className="font-medium">{user.full_name ?? "Unnamed"}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.status === "disabled"
                        ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                        : "border-teal-400/30 bg-teal-400/10 text-teal-200"
                    }
                  >
                    {user.status ?? "active"}
                  </Badge>
                </TableCell>
                <TableCell>{user.subscriptions_count ?? 0}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="rounded-lg">
                      <Link href={`/admin/subscriptions/assign?userId=${user.id}`}>
                        Assign
                      </Link>
                    </Button>
                    <UserActions
                      user={user}
                      pending={pending}
                      onRole={() => changeRole(user)}
                      onStatus={() => changeStatus(user)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
