"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-cyan-500/10 via-background to-teal-500/5 px-8 py-16 text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
        >
          <div className="pointer-events-none absolute -left-10 top-0 size-56 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 size-56 rounded-full bg-teal-400/15 blur-3xl" />
          <h2 className="relative font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to take control of recurring spend?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-muted-foreground">
            DaBills is invite-only. Register with a code and start managing every
            subscription from one premium dashboard.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-12 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 px-8 font-semibold text-black"
            >
              <Link href="/register">Start Managing</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-xl border-white/15 bg-white/5"
            >
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
