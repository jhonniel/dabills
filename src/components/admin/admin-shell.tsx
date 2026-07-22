"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  ScrollText,
  Shield,
  Ticket,
  Users,
  Wallet,
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
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/invites", label: "Invite codes", icon: Ticket },
  { href: "/admin/payments", label: "Payments", icon: Wallet },
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
    <nav className="flex flex-col gap-1">
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
        <div className="absolute top-0 left-0 size-[26rem] rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="absolute right-0 bottom-0 size-[22rem] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin" className="inline-flex items-center gap-2">
            <Shield className="size-4 text-cyan-300" />
            <span className="font-display font-semibold">{APP_NAME} Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen((v) => !v)}
              aria-label="Open menu"
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
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
            <Link href="/admin" className="mb-2 inline-flex items-center gap-2 px-1">
              <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600">
                <Shield className="size-4 text-black" />
              </span>
              <span className="font-display text-lg font-semibold">Admin</span>
            </Link>
            <p className="mb-5 px-1 text-xs text-muted-foreground">{adminEmail}</p>
            <Nav />
            <Separator className="my-4 bg-white/10" />
            <div className="flex items-center justify-between gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard">User app</Link>
              </Button>
              <ThemeToggle />
            </div>
            <form action={logoutAction} className="mt-3">
              <Button variant="ghost" size="sm" type="submit" className="w-full justify-start">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
            {isDemo && (
              <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[11px] leading-relaxed text-cyan-100/90">
                Demo admin mode — all tools are available without Supabase auth.
              </p>
            )}
          </div>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 pb-10 outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
