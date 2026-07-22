"use client";

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

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={pending || user.role === "admin"}
                    onClick={() => {
                      startTransition(async () => {
                        const nextRole = user.role === "admin" ? "user" : "admin";
                        const result = await adminUpdateUserRoleAction(
                          user.id,
                          nextRole
                        );
                        if (!result.success) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success(`Role updated to ${nextRole}`);
                        router.refresh();
                      });
                    }}
                  >
                    Make {user.role === "admin" ? "user" : "admin"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={pending || user.role === "admin"}
                    onClick={() => {
                      startTransition(async () => {
                        const next =
                          user.status === "disabled" ? "active" : "disabled";
                        const result = await adminToggleUserStatusAction(
                          user.id,
                          next
                        );
                        if (!result.success) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success(`User ${next}`);
                        router.refresh();
                      });
                    }}
                  >
                    {user.status === "disabled" ? "Enable" : "Disable"}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
