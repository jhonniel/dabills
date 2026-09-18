"use client";

import { BrandLogo } from "@/components/landing/brand-logo";
import { formatMoney } from "@/lib/billing/expenses";
import type { ShowcasePlan } from "@/types/showcase";

function formatPrice(price: number, frequency: string) {
  if (price === 0) return "Variable";
  const suffix =
    frequency === "yearly"
      ? "/yr"
      : frequency === "weekly"
        ? "/wk"
        : frequency === "quarterly"
          ? "/qtr"
          : "/mo";
  return `${formatMoney(price)}${suffix}`;
}

function SubscriptionCard({ plan }: { plan: ShowcasePlan }) {
  return (
    <div className="w-[200px] shrink-0 rounded-2xl border border-white/15 bg-white/[0.08] p-3.5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.12] sm:w-[220px] sm:p-4">
      <div className="flex items-center gap-3">
        <BrandLogo
          name={plan.name}
          domain={plan.domain}
          logoUrl={plan.logoUrl}
          className="size-10 sm:size-11"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{plan.name}</p>
          <p className="text-xs text-zinc-500">{plan.category}</p>
        </div>
      </div>
      <p className="mt-3 font-display text-base font-semibold tracking-tight text-white sm:mt-4 sm:text-lg">
        {formatPrice(plan.price, plan.billingFrequency)}
      </p>
    </div>
  );
}

export function SubscriptionCarousel({ plans }: { plans: ShowcasePlan[] }) {
  if (plans.length === 0) {
    return (
      <section
        id="showcase"
        className="relative border-t border-white/10 bg-[#070b12] py-14 sm:py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium text-cyan-400">Subscriptions</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Plans you can subscribe to
          </h2>
          <p className="mt-3 text-sm text-zinc-500">
            No active plans yet. Admins can add them under Subscription plans.
          </p>
        </div>
      </section>
    );
  }

  // Two copies for seamless CSS marquee
  const items = [...plans, ...plans];

  return (
    <section
      id="showcase"
      className="relative border-t border-white/10 bg-[#070b12] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-lg sm:mb-10">
          <p className="text-sm font-medium text-cyan-400">Subscriptions</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Plans you can subscribe to
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Same catalog your admin manages — streaming, internet, SaaS, and
            more, in pesos.
          </p>
        </div>
      </div>

      <div className="group/marquee relative overflow-hidden py-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#070b12] to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#070b12] to-transparent sm:w-16" />
        <div className="flex w-max gap-3 px-4 motion-safe:animate-[marquee_45s_linear_infinite] motion-safe:group-hover/marquee:[animation-play-state:paused]">
          {items.map((plan, index) => (
            <SubscriptionCard key={`${plan.id}-${index}`} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
