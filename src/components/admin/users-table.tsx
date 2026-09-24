"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Link2, Mail, Search } from "lucide-react";

import {
  adminCreateUserAction,
  adminSendActivationLinkAction,
  adminToggleUserStatusAction,
  adminUpdateUserCodeNameAction,
  adminUpdateUserRoleAction,
} from "@/features/admin/actions";
import type { AdminUser } from "@/lib/admin/demo-store";
import {
  filterAdminUsers,
} from "@/lib/admin/user-search";
import {
  displayUserEmail,
  isPlaceholderEmail,
} from "@/lib/admin/pending-email";
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

type CreateDelivery = "later" | "email" | "link";

function statusBadgeClass(status: string | undefined) {
  if (status === "disabled") {
    return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  }
  if (status === "pending") {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }
  return "border-teal-400/30 bg-teal-400/10 text-teal-200";
}

function UserActions({
  user,
  pending,
  onRole,
  onStatus,
  onEmailLink,
  onCopyLink,
}: {
  user: AdminUser;
  pending: boolean;
  onRole: () => void;
  onStatus: () => void;
  onEmailLink: () => void;
  onCopyLink: () => void;
}) {
  const status = user.account_status ?? user.status ?? "active";
  const canActivate = status === "pending" || status === "active";

  return (
    <div className="flex flex-wrap gap-2 sm:justify-end">
      {canActivate && user.role !== "admin" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={pending}
            onClick={onCopyLink}
          >
            <Link2 className="size-3.5" />
            Copy link
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg"
            disabled={pending}
            onClick={onEmailLink}
          >
            <Mail className="size-3.5" />
            Email link
          </Button>
        </>
      )}
      <Button
        size="sm"
        variant="outline"
        className="rounded-lg"
        disabled={pending || user.role === "admin"}
        onClick={onRole}
      >
        Make {user.role === "admin" ? "user" : "admin"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="rounded-lg"
        disabled={pending || user.role === "admin" || status === "pending"}
        onClick={onStatus}
      >
        {status === "disabled" ? "Enable" : "Disable"}
      </Button>
    </div>
  );
}

export function AdminUsersTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [delivery, setDelivery] = useState<CreateDelivery>("later");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [likeQuery, setLikeQuery] = useState("");
  const [claimForUserId, setClaimForUserId] = useState<string | null>(null);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimSendEmail, setClaimSendEmail] = useState(true);

  const filtered = useMemo(
    () => filterAdminUsers(users, { like: likeQuery }),
    [users, likeQuery]
  );

  const needsEmailForClaim = delivery === "email" || delivery === "link";
  const canCreate =
    fullName.trim().length >= 2 &&
    (!needsEmailForClaim || Boolean(email.trim()));

  const changeRole = (user: AdminUser) => {
    startTransition(async () => {
      const nextRole = user.role === "admin" ? "user" : "admin";
      const result = await adminUpdateUserRoleAction(user.id, nextRole);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`Role updated to ${nextRole}`);
      router.refresh();
    });
  };

  const changeStatus = (user: AdminUser) => {
    startTransition(async () => {
      const current = user.account_status ?? user.status ?? "active";
      const next = current === "disabled" ? "active" : "disabled";
      const result = await adminToggleUserStatusAction(user.id, next);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`User ${next}`);
      router.refresh();
    });
  };

  const runClaimLink = (
    user: AdminUser,
    sendEmail: boolean,
    emailOverride?: string
  ) => {
    startTransition(async () => {
      const result = await adminSendActivationLinkAction({
        userId: user.id,
        sendEmail,
        email: emailOverride,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const url = result.data?.activationUrl ?? null;
      setLastLink(url);
      setClaimForUserId(null);
      setClaimEmail("");
      if (sendEmail) {
        toast.success(
          result.data?.emailed
            ? "Claim link emailed — no invite code needed"
            : "Email not configured — copy the claim link below"
        );
      } else if (url) {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Claim link copied — no invite code needed");
        } catch {
          toast.success("Claim link ready — copy it below");
        }
      }
      router.refresh();
    });
  };

  const prepareActivation = (user: AdminUser, sendEmail: boolean) => {
    if (isPlaceholderEmail(user.email)) {
      setClaimForUserId(user.id);
      setClaimSendEmail(sendEmail);
      setClaimEmail("");
      return;
    }
    runClaimLink(user, sendEmail);
  };

  const saveCodeName = (user: AdminUser, value: string) => {
    startTransition(async () => {
      const result = await adminUpdateUserCodeNameAction(
        user.id,
        value.trim() || null
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(value.trim() ? "Code name linked" : "Code name cleared");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Create user account</CardTitle>
          <CardDescription>
            Name is enough to create a pending seat. Email is only required when
            you send or copy a claim link — the recipient sets a password and does
            not need an invite code.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="create-user-name">Full name</Label>
            <Input
              id="create-user-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jordan Lee"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-user-email">
              Email{" "}
              <span className="font-normal text-muted-foreground">
                {needsEmailForClaim ? "(required for claim link)" : "(optional)"}
              </span>
            </Label>
            <Input
              id="create-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@example.com"
            />
          </div>
          <fieldset className="space-y-2 sm:col-span-2">
            <Legend className="text-sm font-medium text-zinc-300">
              Claim link
            </Legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  {
                    value: "later" as const,
                    title: "Send later",
                    hint: "Create without email — add it when you claim later",
                  },
                  {
                    value: "email" as const,
                    title: "Email claim link",
                    hint: "Requires email — no invite code for the user",
                  },
                  {
                    value: "link" as const,
                    title: "Copy claim link",
                    hint: "Requires email — share the direct claim URL",
                  },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border px-3 py-3 text-sm transition-colors ${
                    delivery === option.value
                      ? "border-cyan-400/40 bg-cyan-400/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="activation-delivery"
                    className="sr-only"
                    checked={delivery === option.value}
                    onChange={() => setDelivery(option.value)}
                  />
                  <span className="font-medium text-zinc-100">{option.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <Button
              disabled={pending || !canCreate}
              className="rounded-xl bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
              onClick={() => {
                startTransition(async () => {
                  const result = await adminCreateUserAction({
                    email: email.trim() || undefined,
                    fullName,
                    sendActivation: delivery === "email",
                  });
                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }

                  if (delivery === "link") {
                    const linkResult = await adminSendActivationLinkAction({
                      userId: result.data!.id,
                      sendEmail: false,
                      email: email.trim() || undefined,
                    });
                    if (!linkResult.success) {
                      toast.error(linkResult.error);
                      return;
                    }
                    const url = linkResult.data?.activationUrl ?? null;
                    setLastLink(url);
                    if (url) {
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success("Account created — claim link copied");
                      } catch {
                        toast.success(
                          "Account created — copy the claim link below"
                        );
                      }
                    }
                  } else if (delivery === "email") {
                    setLastLink(result.data?.activationUrl ?? null);
                    toast.success(
                      result.data?.emailed
                        ? "Account created and claim link emailed"
                        : "Account created — copy the claim link below (email not configured)"
                    );
                  } else {
                    setLastLink(null);
                    toast.success(
                      "Account created as pending. Add email when you send a claim link."
                    );
                  }

                  setEmail("");
                  setFullName("");
                  setDelivery("later");
                  router.refresh();
                });
              }}
            >
              Create account
            </Button>
          </div>
          {lastLink && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3 sm:col-span-2">
              <p className="text-xs text-muted-foreground">
                Direct claim link (no invite code)
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate text-xs text-cyan-200">
                  {lastLink}
                </code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={async () => {
                    await navigator.clipboard.writeText(lastLink);
                    toast.success("Link copied");
                  }}
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={likeQuery}
          onChange={(e) => setLikeQuery(e.target.value)}
          placeholder="Search like name, email, or code name…"
          className="pl-10 md:pl-10"
          aria-label="Search users"
        />
      </div>

      {claimForUserId && (
        <div className="space-y-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
          <p className="text-sm text-zinc-200">
            Add an email to send or copy the claim link. The user will set a
            password — no invite code required.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="claim-email">Email for claim link</Label>
              <Input
                id="claim-email"
                type="email"
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={pending}
                onClick={() => {
                  setClaimForUserId(null);
                  setClaimEmail("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-cyan-400 font-semibold text-black hover:bg-cyan-300"
                disabled={pending || !claimEmail.trim()}
                onClick={() => {
                  const user = users.find((item) => item.id === claimForUserId);
                  if (!user) return;
                  runClaimLink(user, claimSendEmail, claimEmail.trim());
                }}
              >
                {claimSendEmail ? "Email claim link" : "Copy claim link"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 md:hidden">
        {filtered.map((user) => {
          const status = user.account_status ?? user.status ?? "active";
          return (
            <div
              key={user.id}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{user.full_name ?? "Unnamed"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayUserEmail(user.email)}
                  </p>
                  {user.code_name && (
                    <p className="mt-1 font-mono text-xs text-cyan-300">
                      {user.code_name}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={statusBadgeClass(status)}
                  >
                    {status}
                  </Badge>
                </div>
              </div>
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">Code name</Label>
                <div className="mt-1.5 flex gap-2">
                  <CodeNameField
                    user={user}
                    pending={pending}
                    onSave={(value) => saveCodeName(user, value)}
                  />
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {user.subscriptions_count ?? 0} subscriptions
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="rounded-lg">
                  <Link href={`/admin/subscriptions/assign?userId=${user.id}`}>
                    Assign seat
                  </Link>
                </Button>
                <UserActions
                  user={user}
                  pending={pending}
                  onRole={() => changeRole(user)}
                  onStatus={() => changeStatus(user)}
                  onEmailLink={() => prepareActivation(user, true)}
                  onCopyLink={() => prepareActivation(user, false)}
                />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-muted-foreground">
            No users match this search.
          </p>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] md:block">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead>User</TableHead>
              <TableHead>Code name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscriptions</TableHead>
              <TableHead className="w-80" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => {
              const status = user.account_status ?? user.status ?? "active";
              return (
                <TableRow key={user.id} className="border-white/10">
                  <TableCell>
                    <p className="font-medium">{user.full_name ?? "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">
                      {displayUserEmail(user.email)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <CodeNameField
                      user={user}
                      pending={pending}
                      onSave={(value) => saveCodeName(user, value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusBadgeClass(status)}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.subscriptions_count ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                      >
                        <Link
                          href={`/admin/subscriptions/assign?userId=${user.id}`}
                        >
                          Assign
                        </Link>
                      </Button>
                      <UserActions
                        user={user}
                        pending={pending}
                        onRole={() => changeRole(user)}
                        onStatus={() => changeStatus(user)}
                        onEmailLink={() => prepareActivation(user, true)}
                        onCopyLink={() => prepareActivation(user, false)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No users match this search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CodeNameField({
  user,
  pending,
  onSave,
}: {
  user: AdminUser;
  pending: boolean;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(user.code_name ?? "");

  useEffect(() => {
    setValue(user.code_name ?? "");
  }, [user.id, user.code_name]);

  const dirty = value.trim() !== (user.code_name ?? "").trim();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. JORDAN"
        className="h-8 max-w-[9.5rem] font-mono text-xs"
        disabled={pending}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8 shrink-0 rounded-lg"
        disabled={pending || !dirty}
        onClick={() => onSave(value)}
      >
        Link
      </Button>
    </div>
  );
}

function Legend({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <legend className={className}>{children}</legend>;
}
