"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  X,
} from "lucide-react";
import { useState } from "react";

import { logoutAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/dashboard/billing", label: "Billing", icon: Receipt },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export function DashboardShell({
  children,
  isDemo = false,
}: {
  children: React.ReactNode;
  isDemo?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const Nav = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
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
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
              active
                ? "bg-cyan-400/15 text-cyan-200"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-svh bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-24 top-0 size-[28rem] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute right-0 top-40 size-[22rem] rounded-full bg-teal-500/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-600">
              <span className="font-display text-xs font-bold text-black">D</span>
            </span>
            <span className="font-display font-semibold">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="border-t border-white/10 px-4 py-4">
            <Nav onNavigate={() => setOpen(false)} />
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
            <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 px-1">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600">
                <span className="font-display text-sm font-bold text-black">D</span>
              </span>
              <span className="font-display text-lg font-semibold">{APP_NAME}</span>
            </Link>

            <Nav />

            <Separator className="my-4 bg-white/10" />

            <div className="flex items-center justify-between gap-2">
              <ThemeToggle />
              <form action={logoutAction}>
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>

            {isDemo && (
              <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[11px] leading-relaxed text-cyan-100/90">
                Demo mode — data is local until Supabase is connected.
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
