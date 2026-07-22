import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME } from "@/lib/constants";

export default function RegisterPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-svh items-center justify-center px-4 py-16 outline-none"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(20,184,166,0.1),transparent_45%)]" />
      </div>

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600">
            <span className="font-display text-sm font-bold text-black">D</span>
          </span>
          <span className="font-display text-lg font-semibold">{APP_NAME}</span>
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Registration is invite-only. Enter a valid code to continue.
        </p>
        <div className="mt-8">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
