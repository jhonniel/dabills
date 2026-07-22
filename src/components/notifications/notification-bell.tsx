"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useTransition } from "react";

import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/notifications/actions";
import type { Notification } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NotificationBell({
  items,
  unreadCount,
}: {
  items: Notification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const preview = items.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-black">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={pending}
              className="text-xs font-normal text-cyan-300 hover:underline"
              onClick={() => {
                startTransition(async () => {
                  await markAllNotificationsReadAction();
                  router.refresh();
                });
              }}
            >
              Mark all read
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {preview.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            You’re all caught up.
          </div>
        )}
        {preview.map((item) => (
          <DropdownMenuItem
            key={item.id}
            className="flex cursor-pointer flex-col items-start gap-1 py-3"
            onClick={() => {
              startTransition(async () => {
                if (!item.is_read) {
                  await markNotificationReadAction(item.id);
                }
                router.push(item.href ?? "/dashboard/settings/notifications");
                router.refresh();
              });
            }}
          >
            <div className="flex w-full items-start justify-between gap-2">
              <p
                className={cn(
                  "text-sm",
                  !item.is_read && "font-semibold text-foreground"
                )}
              >
                {item.title}
              </p>
              {!item.is_read && (
                <span className="mt-1 size-2 shrink-0 rounded-full bg-cyan-400" />
              )}
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
            <p className="text-[10px] text-muted-foreground">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/notifications" className="justify-center">
            Notification settings
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
