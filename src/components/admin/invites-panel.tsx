"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  adminCreateInviteAction,
  adminToggleInviteAction,
} from "@/features/admin/actions";
import type { InviteCode } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function formatExpires(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function usageLabel(invite: InviteCode) {
  return `${invite.uses_count}${invite.max_uses != null ? ` / ${invite.max_uses}` : " / ∞"}`;
}

export function AdminInvitesPanel({ invites }: { invites: InviteCode[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("10");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const toggleInvite = (invite: InviteCode) => {
    startTransition(async () => {
      const result = await adminToggleInviteAction(invite.id, !invite.is_active);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(invite.is_active ? "Invite disabled" : "Invite enabled");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-display text-lg font-semibold tracking-tight text-zinc-100">
            Generate invite code
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Codes can expire, have usage limits, and be disabled anytime.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-zinc-400">
              Code
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TEAM-ALPHA"
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUses" className="text-zinc-400">
              Max uses
            </Label>
            <Input
              id="maxUses"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt" className="text-zinc-400">
              Expires (optional)
            </Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note" className="text-zinc-400">
              Note
            </Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note"
            />
          </div>
        </div>

        <div className="mt-5">
          <Button
            disabled={pending || !code.trim()}
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
            onClick={() => {
              startTransition(async () => {
                const result = await adminCreateInviteAction({
                  code,
                  maxUses: maxUses ? Number(maxUses) : null,
                  expiresAt: expiresAt
                    ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString()
                    : null,
                  note: note || null,
                });
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Invite created");
                setCode("");
                setNote("");
                setExpiresAt("");
                router.refresh();
              });
            }}
          >
            Create invite
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">
              Active codes
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {invites.length} invite{invites.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {invites.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-sm text-zinc-400">No invite codes yet</p>
            <p className="mt-1 text-xs text-zinc-600">
              Create one above to let new users register.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-medium tracking-wide text-zinc-100">
                      {invite.code}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        invite.is_active
                          ? "border-teal-400/30 bg-teal-400/10 text-teal-200"
                          : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"
                      }
                    >
                      {invite.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  {invite.note && (
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {invite.note}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500 sm:shrink-0">
                  <span>
                    <span className="text-zinc-600">Usage </span>
                    <span className="tabular-nums text-zinc-300">
                      {usageLabel(invite)}
                    </span>
                  </span>
                  <span>
                    <span className="text-zinc-600">Expires </span>
                    <span className="text-zinc-300">
                      {formatExpires(invite.expires_at)}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-9 rounded-lg border-white/10"
                    disabled={pending}
                    onClick={() => toggleInvite(invite)}
                  >
                    {invite.is_active ? "Disable" : "Enable"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
