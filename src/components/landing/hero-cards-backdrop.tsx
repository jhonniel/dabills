"use client";

import { BrandLogo } from "@/components/landing/brand-logo";
import { formatMoney } from "@/lib/billing/expenses";
import type { ShowcasePlan } from "@/types/showcase";

/** Desktop cluster — covers most showcase brands on the right */
const DESKTOP = [
  { top: "6%", left: "2%", rotate: -5 },
  { top: "4%", left: "38%", rotate: 3 },
  { top: "8%", left: "72%", rotate: -2 },
  { top: "26%", left: "-2%", rotate: 4 },
  { top: "24%", left: "34%", rotate: -4 },
  { top: "28%", left: "68%", rotate: 5 },
  { top: "46%", left: "6%", rotate: -3 },
  { top: "44%", left: "42%", rotate: 2 },
  { top: "48%", left: "74%", rotate: -5 },
  { top: "66%", left: "0%", rotate: 3 },
  { top: "64%", left: "36%", rotate: -2 },
  { top: "68%", left: "66%", rotate: 4 },
] as const;

/** Mobile scatter — top + bottom, mixed brands */
const MOBILE = [
  { top: "6%", left: "2%", rotate: -7 },
  { top: "5%", left: "52%", rotate: 4 },
  { top: "18%", left: "60%", rotate: -3 },
  { top: "22%", left: "6%", rotate: 5 },
  { top: "34%", left: "36%", rotate: -4 },
  { top: "58%", left: "4%", rotate: 3 },
  { top: "62%", left: "55%", rotate: -6 },
  { top: "74%", left: "18%", rotate: 2 },
  { top: "78%", left: "62%", rotate: -3 },
  { top: "88%", left: "8%", rotate: 5 },
] as const;

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

function CardFace({
  plan,
  compact = false,
}: {
  plan: ShowcasePlan;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "rounded-xl border border-white/15 bg-white/[0.08] p-3"
          : "rounded-2xl border border-white/15 bg-white/[0.08] p-4"
      }
    >
      <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
        <BrandLogo
          name={plan.name}
          domain={plan.domain}
          logoUrl={plan.logoUrl}
          className={compact ? "size-8" : "size-10"}
          imgClassName={compact ? "size-4" : "size-6"}
        />
        <div className="min-w-0">
          <p
            className={
              compact
                ? "truncate text-xs font-medium text-white"
                : "truncate text-sm font-medium text-white"
            }
          >
            {plan.name}
          </p>
          <p className={compact ? "text-[10px] text-zinc-500" : "text-xs text-zinc-500"}>
            {plan.category}
          </p>
        </div>
      </div>
      <p
        className={
          compact
            ? "mt-2 font-display text-sm font-semibold text-white"
            : "mt-3 font-display text-lg font-semibold text-white"
        }
      >
        {formatPrice(plan.price, plan.billingFrequency)}
      </p>
    </div>
  );
}

/** Decorative floating cards from live admin subscription plans */
export function HeroCardsBackdrop({ plans }: { plans: ShowcasePlan[] }) {
  if (plans.length === 0) return null;

  const desktopCards = plans.slice(0, DESKTOP.length);
  const mobileCards = [
    ...plans.slice(0, 5),
    ...plans.slice(8, 13),
  ].slice(0, MOBILE.length);

  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden">
        {mobileCards.map((plan, index) => {
          const place = MOBILE[index] ?? MOBILE[0];
          return (
            <div
              key={`m-${plan.id}-${index}`}
              className="absolute w-[128px] opacity-30 motion-safe:animate-[hero-float_5s_ease-in-out_infinite] sm:w-[140px] sm:opacity-35"
              style={{
                top: place.top,
                left: place.left,
                rotate: `${place.rotate}deg`,
                animationDelay: `${index * 0.28}s`,
              }}
            >
              <CardFace plan={plan} compact />
            </div>
          );
        })}
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] opacity-50 lg:block"
      >
        <div className="relative h-full w-full">
          {desktopCards.map((plan, index) => {
            const place = DESKTOP[index] ?? DESKTOP[0];
            return (
              <div
                key={`d-${plan.id}`}
                className="absolute w-[240px] motion-safe:animate-[hero-float_5.5s_ease-in-out_infinite] xl:w-[260px]"
                style={{
                  top: place.top,
                  left: place.left,
                  rotate: `${place.rotate}deg`,
                  animationDelay: `${index * 0.22}s`,
                }}
              >
                <CardFace plan={plan} />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
