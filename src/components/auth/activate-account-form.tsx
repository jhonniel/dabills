"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { activateAccountAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ActivateAccountForm({
  demoToken,
}: {
  demoToken?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await activateAccountAction({
            password,
            confirmPassword,
            demoToken,
          });
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Account activated");
          router.replace(demoToken ? "/login?activated=1" : "/dashboard");
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="activate-password">Password</Label>
        <Input
          id="activate-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="activate-confirm">Confirm password</Label>
        <Input
          id="activate-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
      >
        {pending ? "Activating…" : "Activate account"}
      </Button>
    </form>
  );
}
