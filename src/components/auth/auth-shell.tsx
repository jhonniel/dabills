import Link from "next/link";

import { AppWordmark } from "@/components/brand/app-wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function AuthShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative min-h-dvh outline-none lg:grid lg:grid-cols-2"
    >
      <aside className="relative hidden overflow-hidden bg-[#070b12] lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-20 size-[28rem] rounded-full bg-cyan-500/15 blur-[100px]" />
          <div className="absolute right-0 bottom-0 size-[22rem] rounded-full bg-teal-500/10 blur-[90px]" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <Link href="/" className="relative z-10 inline-flex items-center">
          <AppWordmark size="lg" priority />
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-sm font-medium tracking-wide text-cyan-300/90">
            Invite-only access
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.1] tracking-tight text-white xl:text-5xl">
            {APP_TAGLINE}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-zinc-400">
            Track renewals, settle bills with receipt verification, and keep
            every subscription under control — in pesos.
          </p>

          <ul className="mt-10 space-y-3 text-sm text-zinc-400">
            {[
              "Recurring bills in Philippine pesos",
              "Receipt OCR with payment verification",
              "Admin-managed seats and invites",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-cyan-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-zinc-600">
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </aside>

      <section className="relative flex flex-col bg-background">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.1),transparent_55%)]" />
        </div>

        <div className="relative z-10 flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 lg:px-12">
          <Link
            href="/"
            className="inline-flex items-center lg:invisible"
          >
            <AppWordmark size="md" priority />
          </Link>
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
