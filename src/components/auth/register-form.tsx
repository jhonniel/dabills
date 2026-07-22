"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [checkingInvite, setCheckingInvite] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<"idle" | "valid" | "invalid">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

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
        <Label htmlFor="inviteCode">Invite code</Label>
        <div className="flex gap-2">
          <Input
            id="inviteCode"
            placeholder="DABILLS-XXXX"
            className="uppercase"
            {...form.register("inviteCode")}
            onBlur={checkInvite}
          />
          <Button
            type="button"
            variant="outline"
            onClick={checkInvite}
            disabled={checkingInvite}
            className="shrink-0"
          >
            {checkingInvite ? "..." : "Check"}
          </Button>
        </div>
        {inviteStatus === "valid" && (
          <p className="text-xs text-teal-400">Invite code accepted</p>
        )}
        {inviteStatus === "invalid" && (
          <p className="text-xs text-destructive">Invite code rejected</p>
        )}
        {form.formState.errors.inviteCode && (
          <p className="text-xs text-destructive">
            {form.formState.errors.inviteCode.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          autoComplete="name"
          placeholder="Jordan Lee"
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName && (
          <p className="text-xs text-destructive">
            {form.formState.errors.fullName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          {...form.register("confirmPassword")}
        />
        {form.formState.errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
      >
        {pending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-300 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
