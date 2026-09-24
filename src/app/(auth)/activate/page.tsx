import { AuthShell } from "@/components/auth/auth-shell";
import { ActivateAccountForm } from "@/components/auth/activate-account-form";

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Claim your account"
      description="Set a password to finish setup. This link was sent by an admin — no invite code needed."
    >
      <ActivateAccountForm demoToken={params.token ?? null} />
    </AuthShell>
  );
}
