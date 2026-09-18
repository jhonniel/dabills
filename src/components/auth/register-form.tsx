"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { registerAction } from "@/features/auth/actions";
import { validateInviteCodeAction } from "@/features/invites/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/validators/auth";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 rounded-xl border-white/10 bg-white/[0.03] !pl-10 !pr-3 md:h-11 dark:bg-white/[0.03]";

const fieldClassWithToggle =
  "h-11 rounded-xl border-white/10 bg-white/[0.03] !pl-10 !pr-11 md:h-11 dark:bg-white/[0.03]";

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      inviteCode: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const checkInvite = async () => {
    const code = form.getValues("inviteCode");
    if (!code || code.length < 6) {
      setInviteStatus("invalid");
      return;
    }

    setCheckingInvite(true);
    const result = await validateInviteCodeAction(code);
    setCheckingInvite(false);
    setInviteStatus(result.valid ? "valid" : "invalid");

    if (!result.valid) {
      toast.error(result.error);
    } else {
      toast.success("Invite code is valid");
    }
  };

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      const result = await registerAction(values);
      if (result && !result.success) {
        setError(result.error);
        toast.error(result.error);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inviteCode" className="text-sm font-medium">
          Invite code
        </Label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="inviteCode"
              placeholder="DABILLS-XXXX"
              className={cn(fieldClass, "uppercase tracking-wide")}
              aria-invalid={
                inviteStatus === "invalid" ||
                Boolean(form.formState.errors.inviteCode)
              }
              {...form.register("inviteCode")}
              onBlur={checkInvite}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={checkInvite}
            disabled={checkingInvite}
            className="h-11 shrink-0 rounded-xl border-white/10 px-4"
          >
            {checkingInvite ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Verify"
            )}
          </Button>
        </div>
        {inviteStatus === "valid" && (
          <p className="inline-flex items-center gap-1.5 text-xs text-teal-400">
            <CheckCircle2 className="size-3.5" />
            Invite code accepted
          </p>
        )}
        {inviteStatus === "invalid" && (
          <p className="inline-flex items-center gap-1.5 text-xs text-destructive">
            <XCircle className="size-3.5" />
            Invite code rejected
          </p>
        )}
        {form.formState.errors.inviteCode && (
          <p className="text-xs text-destructive">
            {form.formState.errors.inviteCode.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </Label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Jordan Lee"
            className={fieldClass}
            aria-invalid={Boolean(form.formState.errors.fullName)}
            {...form.register("fullName")}
          />
        </div>
        {form.formState.errors.fullName && (
          <p className="text-xs text-destructive">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
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

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat password"
              className={fieldClassWithToggle}
              aria-invalid={Boolean(form.formState.errors.confirmPassword)}
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
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
        className="mt-1 h-11 w-full rounded-xl bg-cyan-400 text-sm font-semibold text-black shadow-[0_0_24px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.3)]"
      >
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="pt-1 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-cyan-300 transition-colors hover:text-cyan-200"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
