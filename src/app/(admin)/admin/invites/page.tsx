import { listAdminInvites } from "@/features/admin/queries";
import { AdminInvitesPanel } from "@/components/admin/invites-panel";

export default async function AdminInvitesPage() {
  const { items } = await listAdminInvites();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Invite codes
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Generate, limit, expire, and disable registration invites.
        </p>
      </div>
      <AdminInvitesPanel invites={items} />
    </div>
  );
}
