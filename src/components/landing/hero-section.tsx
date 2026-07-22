"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { LANDING_STATS } from "@/lib/constants";

const HeroScene = dynamic(
  () =>
    import("@/components/landing/hero-scene").then((mod) => mod.HeroScene),
  { ssr: false, loading: () => <div className="absolute inset-0 -z-10 bg-background" /> }
);

function AnimatedStat({
  value,
  prefix = "",
  suffix = "",
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      if (!ref.current) return;
      const formatted =
        value % 1 === 0
          ? Math.round(latest).toLocaleString()
          : latest.toFixed(1);
      ref.current.textContent = `${prefix}${formatted}${suffix}`;
    });
    return unsubscribe;
  }, [prefix, spring, suffix, value]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
      <span ref={ref} className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {prefix}0{suffix}
      </span>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden pt-28 pb-16">
      <HeroScene />

      <div className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute -left-24 top-24 size-[28rem] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute -right-16 bottom-10 size-[24rem] rounded-full bg-teal-500/10 blur-[110px]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl"
        >
          <p className="mb-6 inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium tracking-wide text-cyan-200">
            Invite-only subscription intelligence
          </p>
          <h1 className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            All Your Subscriptions.
            <span className="block bg-gradient-to-r from-cyan-300 via-teal-200 to-white bg-clip-text text-transparent">
              One Smart Dashboard.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Track every subscription. Never miss a payment. Manage recurring
            bills effortlessly.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-12 min-w-44 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 px-8 text-base font-semibold text-black shadow-[0_0_40px_rgba(34,211,238,0.25)] hover:from-cyan-300 hover:to-teal-400"
            >
              <Link href="/register">Start Managing</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 min-w-44 rounded-xl border-white/15 bg-white/5 px-8 text-base backdrop-blur-md"
            >
              <Link href="/#showcase">View Demo</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="mt-16 grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4"
        >
          {LANDING_STATS.map((stat) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              prefix={"prefix" in stat ? stat.prefix : ""}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
