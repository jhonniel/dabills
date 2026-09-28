import { listAdminUsers, listAssignedSubscriptions } from "@/features/admin/queries";
import { AdminUsersTable } from "@/components/admin/users-table";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [{ items }, assigned] = await Promise.all([
    listAdminUsers(),
    listAssignedSubscriptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Users
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create seats without email, link code names, then send a claim link
          when ready — no invite code for the recipient. Assigned subscriptions
          are listed on each user, including start and next billing dates.
        </p>
      </div>
      <AdminUsersTable users={items} assigned={assigned} />
    </div>
  );
}
