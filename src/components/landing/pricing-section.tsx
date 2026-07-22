"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PRICING_PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="text-sm font-medium text-cyan-300">Pricing</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Plans that scale with your stack.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Architecture-ready for payments in a later phase. Choose the tier
            that matches how you manage recurring spend.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-5">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.tier}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className={cn(
                "relative flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md",
                plan.highlighted &&
                  "border-cyan-400/40 bg-gradient-to-b from-cyan-400/10 to-transparent shadow-[0_0_50px_rgba(34,211,238,0.12)] lg:-translate-y-2"
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-cyan-400/30 bg-cyan-400/15 px-3 py-0.5 text-[11px] font-medium text-cyan-200">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-xs text-muted-foreground">
                {plan.description}
              </p>
              <div className="mt-5">
                {plan.tier === "enterprise" ? (
                  <p className="font-display text-3xl font-semibold tracking-tight">
                    Custom
                  </p>
                ) : (
                  <p className="font-display text-3xl font-semibold tracking-tight">
                    ${plan.priceMonthly}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                )}
              </div>
              <ul className="mt-5 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-3.5 shrink-0 text-cyan-300" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={cn(
                  "mt-6 w-full rounded-xl",
                  plan.highlighted
                    ? "bg-gradient-to-r from-cyan-400 to-teal-500 text-black hover:from-cyan-300 hover:to-teal-400"
                    : "border border-white/10 bg-white/5 hover:bg-white/10"
                )}
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link href="/register">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
