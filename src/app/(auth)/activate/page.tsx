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
      title="Activate your account"
      description="Set a password to finish setting up the account an admin created for you."
    >
      <ActivateAccountForm demoToken={params.token ?? null} />
    </AuthShell>
  );
}
