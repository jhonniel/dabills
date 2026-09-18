import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Registration is invite-only. Enter a valid code to continue."
    >
      <RegisterForm />
    </AuthShell>
  );
}
