"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  History,
  KeyRound,
  LayoutDashboard,
  Mail,
  RefreshCw,
  ScanText,
  type LucideIcon,
} from "lucide-react";

import { FEATURES } from "@/lib/constants";

const iconMap: Record<string, LucideIcon> = {
  RefreshCw,
  ScanText,
  Mail,
  History,
  LayoutDashboard,
  BarChart3,
  KeyRound,
};

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-14 max-w-2xl text-center"
        >
          <p className="text-sm font-medium text-cyan-300">Features</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Built like a product you trust with money.
          </h2>
          <p className="mt-3 text-muted-foreground">
            From OCR validation to invite-only access — every surface is designed
            for clarity, speed, and control.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon] ?? LayoutDashboard;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: index * 0.05 }}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md transition hover:border-cyan-400/25 hover:bg-white/[0.05]"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-400/15 to-teal-500/10 text-cyan-300 shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
