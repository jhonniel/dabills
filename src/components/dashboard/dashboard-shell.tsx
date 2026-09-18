"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { useState } from "react";

import { logoutAction } from "@/features/auth/actions";
import { AppWordmark } from "@/components/brand/app-wordmark";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/dashboard/billing", label: "Billing", icon: Receipt },
  { href: "/dashboard/payments", label: "Payments", icon: History },
  {
    href: "/dashboard/settings/notifications",
    label: "Notifications",
    icon: Settings,
  },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function DashboardShell({
  children,
  isDemo = false,
  notifications = [],
  unreadCount = 0,
}: {
  children: React.ReactNode;
  isDemo?: boolean;
  notifications?: Notification[];
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "inline-flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-cyan-400/12 font-medium text-cyan-200"
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
            )}
          >
            <Icon className={cn("size-4", active ? "text-cyan-300" : "text-zinc-500")} />
            {item.label}
            {item.href.includes("notifications") && unreadCount > 0 && (
              <span className="ml-auto rounded-md bg-cyan-400/20 px-1.5 py-0.5 text-[10px] font-medium text-cyan-200">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#070b12] pt-[env(safe-area-inset-top)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b12]/90 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="inline-flex items-center">
            <AppWordmark size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell items={notifications} unreadCount={unreadCount} />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="max-h-[70dvh] overflow-y-auto border-t border-white/[0.06] px-4 py-4">
            <Nav onNavigate={() => setOpen(false)} />
            <Separator className="my-4 bg-white/[0.06]" />
            <form action={logoutAction}>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="min-h-11 w-full justify-start border-white/10"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 px-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:gap-0 lg:px-0 lg:pb-0">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0f18] px-4 py-5 lg:flex">
          <div className="mb-8 px-1">
            <Link href="/dashboard" className="inline-flex items-center">
              <AppWordmark size="md" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="mb-2 px-3 text-[10px] font-medium tracking-[0.14em] text-zinc-600 uppercase">
              Menu
            </p>
            <Nav />
          </div>

          <div className="mt-auto space-y-3 border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between gap-2 px-1">
              <ThemeToggle />
              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="sm"
                  type="submit"
                  className="text-zinc-400 hover:text-zinc-100"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>
            {isDemo && (
              <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
                Demo mode — data is local until Supabase is connected.
              </p>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 hidden h-14 items-center justify-end border-b border-white/[0.06] bg-[#070b12]/90 px-6 backdrop-blur-md lg:flex xl:px-8">
            <NotificationBell items={notifications} unreadCount={unreadCount} />
          </header>

          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>

      <MobileBottomNav onMore={() => setOpen(true)} />
    </div>
  );
}
