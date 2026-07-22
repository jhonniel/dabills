"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import * as React from "react";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#showcase", label: "Showcase" },
  { href: "/#pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const isMarketing = pathname === "/";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "mt-4 flex items-center justify-between rounded-2xl border border-white/10",
            "bg-background/60 px-4 py-3 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
          )}
        >
          <Link href="/" className="group flex items-center gap-2">
            <span className="relative flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 shadow-[0_0_24px_rgba(34,211,238,0.35)]">
              <span className="font-display text-sm font-bold text-black">D</span>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              {APP_NAME}
            </span>
          </Link>

          {isMarketing && (
            <div className="hidden items-center gap-8 md:flex">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-cyan-400 to-teal-500 text-black hover:from-cyan-300 hover:to-teal-400"
            >
              <Link href="/register">Start Managing</Link>
            </Button>
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </motion.nav>

        {open && (
          <div
            id="mobile-nav"
            role="navigation"
            aria-label="Mobile"
            className="mt-2 rounded-2xl border border-white/10 bg-background/90 p-4 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              ))}
              <Button variant="outline" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Start Managing</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
