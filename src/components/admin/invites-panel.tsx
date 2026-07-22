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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function AdminInvitesPanel({ invites }: { invites: InviteCode[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("10");
  const [note, setNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Generate invite code</CardTitle>
          <CardDescription>
            Codes can expire, have usage limits, and be disabled anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TEAM-ALPHA"
              className="uppercase"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxUses">Max uses</Label>
            <Input
              id="maxUses"
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires at (optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              disabled={pending}
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
                  router.refresh();
                });
              }}
            >
              Create invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>Code</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id} className="border-white/10">
                <TableCell>
                  <p className="font-mono text-sm">{invite.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {invite.note ?? "—"}
                  </p>
                </TableCell>
                <TableCell>
                  {invite.uses_count}
                  {invite.max_uses != null ? ` / ${invite.max_uses}` : " / ∞"}
                </TableCell>
                <TableCell>
                  {invite.expires_at
                    ? new Date(invite.expires_at).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      invite.is_active
                        ? "border-teal-400/30 bg-teal-400/10 text-teal-200"
                        : "border-zinc-400/30 bg-zinc-400/10 text-zinc-300"
                    }
                  >
                    {invite.is_active ? "Active" : "Disabled"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={pending}
                    onClick={() => {
                      startTransition(async () => {
                        const result = await adminToggleInviteAction(
                          invite.id,
                          !invite.is_active
                        );
                        if (!result.success) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success(
                          invite.is_active ? "Invite disabled" : "Invite enabled"
                        );
                        router.refresh();
                      });
                    }}
                  >
                    {invite.is_active ? "Disable" : "Enable"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
