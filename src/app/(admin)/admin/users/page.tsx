import { listAdminUsers } from "@/features/admin/queries";
import { AdminUsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const { items } = await listAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Users
        </h1>
        <p className="mt-2 text-muted-foreground">
          View accounts, promote admins, and disable access.
        </p>
      </div>
      <AdminUsersTable users={items} />
    </div>
  );
}
