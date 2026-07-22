"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { markNotificationReadAction } from "@/features/notifications/actions";
import type { EmailLog, Notification } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NotificationInbox({ items }: { items: Notification[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="font-display text-lg">Inbox</CardTitle>
        <CardDescription>Recent in-app alerts and reminders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={pending}
            className={cn(
              "w-full rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition hover:border-cyan-400/20",
              !item.is_read && "border-cyan-400/20 bg-cyan-400/5"
            )}
            onClick={() => {
              startTransition(async () => {
                if (!item.is_read) await markNotificationReadAction(item.id);
                if (item.href) router.push(item.href);
                router.refresh();
              });
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()} ·{" "}
                  <span className="capitalize">
                    {item.type.replaceAll("_", " ")}
                  </span>
                </p>
              </div>
              {!item.is_read && (
                <span className="mt-1 size-2 shrink-0 rounded-full bg-cyan-400" />
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

export function EmailLogsCard({ logs }: { logs: EmailLog[] }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="font-display text-lg">Email history</CardTitle>
        <CardDescription>
          Local/Resend delivery log for reminders and payment emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No emails logged yet. Process reminders or settle a payment to generate
            entries.
          </p>
        )}
        {logs.slice(0, 10).map((log) => (
          <div
            key={log.id}
            className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{log.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  To {log.to_email} · {log.template}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  log.status === "sent" &&
                    "border-teal-400/30 bg-teal-400/10 text-teal-200",
                  log.status === "failed" &&
                    "border-rose-400/30 bg-rose-400/10 text-rose-200"
                )}
              >
                {log.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
