import { requireAdmin } from "@/lib/admin/guard";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <AdminShell adminEmail={session.email} isDemo={session.isDemo}>
      {children}
    </AdminShell>
  );
}
