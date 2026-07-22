import { listAdminInvites } from "@/features/admin/queries";
import { AdminInvitesPanel } from "@/components/admin/invites-panel";

export default async function AdminInvitesPage() {
  const { items } = await listAdminInvites();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Invite codes
        </h1>
        <p className="mt-2 text-muted-foreground">
          Generate, limit, expire, and disable registration invites.
        </p>
      </div>
      <AdminInvitesPanel invites={items} />
    </div>
  );
}
