"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MoreHorizontal,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Pay", icon: Wallet },
] as const;

export function AdminMobileBottomNav({
  onMore,
}: {
  onMore?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin primary"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const active =
            "exact" in tab && tab.exact
              ? pathname === tab.href
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-cyan-300" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "stroke-[2.25]")} />
              <span className="truncate">{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMore}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="size-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
