"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Receipt,
  ScrollText,
  Settings2,
  Ticket,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

import { logoutAction } from "@/features/auth/actions";
import { AppWordmark } from "@/components/brand/app-wordmark";
import { AdminMobileBottomNav } from "@/components/layout/admin-mobile-bottom-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/invites", label: "Invite codes", icon: Ticket },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
  { href: "/admin/payment-setup", label: "Payment setup", icon: Settings2 },
  { href: "/admin/expenses", label: "Expenses", icon: Receipt },
  { href: "/admin/subscriptions/plans", label: "Subscription plans", icon: CreditCard },
  { href: "/admin/subscriptions/assign", label: "Assign seat", icon: UserPlus },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/logs", label: "Activity logs", icon: ScrollText },
  { href: "/admin/emails", label: "Email history", icon: Mail },
];

export function AdminShell({
  children,
  adminEmail,
  isDemo = false,
}: {
  children: React.ReactNode;
  adminEmail: string;
  isDemo?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
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
            <Icon
              className={cn("size-4", active ? "text-cyan-300" : "text-zinc-500")}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-[#070b12] pt-[env(safe-area-inset-top)] text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070b12]/90 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="inline-flex items-center">
            <AppWordmark size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="max-h-[70dvh] overflow-y-auto border-t border-white/[0.06] px-4 py-4">
            <p className="mb-3 px-1 text-xs text-zinc-500">{adminEmail}</p>
            <Nav onNavigate={() => setOpen(false)} />
            <Separator className="my-4 bg-white/[0.06]" />
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm" className="min-h-11 border-white/10">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  User app
                </Link>
              </Button>
            </div>
            <form action={logoutAction} className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="min-h-11 w-full justify-start text-zinc-400"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
            {isDemo && (
              <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
                Demo admin mode — tools work without Supabase auth.
              </p>
            )}
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 px-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#0a0f18] px-4 py-5 lg:flex">
          <div className="mb-6 px-1">
            <Link href="/admin" className="inline-flex items-center">
              <AppWordmark size="md" />
            </Link>
            <p className="mt-2 text-[11px] font-medium tracking-[0.12em] text-zinc-600 uppercase">
              Admin
            </p>
            <p className="mt-1 truncate text-xs text-zinc-500">{adminEmail}</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <p className="mb-2 px-3 text-[10px] font-medium tracking-[0.14em] text-zinc-600 uppercase">
              Menu
            </p>
            <Nav />
          </div>

          <div className="mt-auto space-y-3 border-t border-white/[0.06] pt-4">
            <div className="flex items-center justify-between gap-2 px-1">
              <Button asChild variant="outline" size="sm" className="border-white/10">
                <Link href="/dashboard">User app</Link>
              </Button>
              <ThemeToggle />
            </div>
            <form action={logoutAction}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="w-full justify-start text-zinc-400 hover:text-zinc-100"
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
            {isDemo && (
              <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-[11px] leading-relaxed text-amber-100/80">
                Demo admin mode — tools work without Supabase auth.
              </p>
            )}
          </div>
        </aside>

        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>

      <AdminMobileBottomNav onMore={() => setOpen(true)} />
    </div>
  );
}
