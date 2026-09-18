"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { loginAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/validators/auth";

const fieldClass =
  "h-11 rounded-xl border-white/10 bg-white/[0.03] !pl-10 !pr-3 md:h-11 dark:bg-white/[0.03]";

const fieldClassWithToggle =
  "h-11 rounded-xl border-white/10 bg-white/[0.03] !pl-10 !pr-11 md:h-11 dark:bg-white/[0.03]";

export function LoginForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result && !result.success) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={fieldClass}
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            className={fieldClassWithToggle}
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-200"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-cyan-400 text-sm font-semibold text-black shadow-[0_0_24px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.3)]"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-3 text-muted-foreground">or</span>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Have an invite code?{" "}
        <Link
          href="/register"
          className="font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
