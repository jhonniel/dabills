import {
  Bell,
  LayoutDashboard,
  Receipt,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const POINTS: Array<{
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    title: "Dashboard",
    body: "See monthly spend, upcoming dues, and active subscriptions in one view.",
    icon: LayoutDashboard,
  },
  {
    title: "Billing cycles",
    body: "Recurring bills generate automatically — weekly, monthly, yearly, or custom.",
    icon: Receipt,
  },
  {
    title: "Reminders",
    body: "Email and in-app alerts before due dates so nothing slips through.",
    icon: Bell,
  },
  {
    title: "Admin control",
    body: "Invite-only access. Admins manage users, payments, and verification.",
    icon: ShieldCheck,
  },
];

export function SystemInfoSection() {
  return (
    <section className="border-t border-white/10 bg-[#070b12] py-16 sm:py-24">
      <div className="safe-px mx-auto max-w-7xl">
        <div className="max-w-lg">
          <p className="text-sm font-medium text-cyan-400">Platform</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            What DaBills handles
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Built for invite-only teams that need clear renewals and payment
            verification.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.title} className="space-y-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Icon className="size-5 text-cyan-300" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {point.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {point.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
