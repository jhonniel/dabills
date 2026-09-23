import Link from "next/link";

import { AppWordmark } from "@/components/brand/app-wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="safe-px mx-auto max-w-7xl">
        <nav
          className={cn(
            "mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10",
            "bg-[#070b12]/80 px-3 py-3 backdrop-blur-md sm:px-4"
          )}
        >
          <Link href="/" className="inline-flex items-center">
            <AppWordmark size="md" priority />
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              className="rounded-xl bg-cyan-400 text-black hover:bg-cyan-300"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
