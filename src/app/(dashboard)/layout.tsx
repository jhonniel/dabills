import { isSupabaseConfigured } from "@/lib/env";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell isDemo={!isSupabaseConfigured()}>{children}</DashboardShell>
  );
}
