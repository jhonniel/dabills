import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-teal-600">
              <span className="font-display text-xs font-bold text-black">D</span>
            </span>
            <span className="font-display font-semibold">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="size-4" />
                Overview
              </Link>
            </Button>
            <ThemeToggle />
            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
