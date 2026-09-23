import Link from "next/link";

import { AppLogo } from "@/components/brand/app-logo";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070b12]">
      <div className="safe-px mx-auto flex max-w-7xl flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AppLogo size="sm" />
          <div>
            <p className="font-display text-sm font-semibold text-white">
              {APP_NAME}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Invite-only subscription billing.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-500">
          <Link href="/privacy" className="transition-colors hover:text-zinc-300">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-zinc-300">
            Terms
          </Link>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
