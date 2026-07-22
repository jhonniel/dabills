"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { SHOWCASE_SUBSCRIPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

function formatPrice(price: number) {
  if (price === 0) return "Free / Variable";
  return `$${price.toFixed(2)}/mo`;
}

function SubscriptionCard({
  name,
  price,
  category,
  gradient,
}: {
  name: string;
  price: number;
  category: string;
  gradient: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "group relative w-[220px] shrink-0 overflow-hidden rounded-2xl border border-white/10",
        "bg-gradient-to-br p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]",
        "transition duration-300 hover:-translate-y-1 hover:border-cyan-400/30",
        gradient
      )}
    >
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 font-display text-sm font-semibold backdrop-blur-md">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{name}</p>
            <p className="text-xs text-white/60">{category}</p>
          </div>
        </div>
        <p className="font-display text-lg font-semibold tracking-tight">
          {formatPrice(price)}
        </p>
      </div>
    </div>
  );
}

export function SubscriptionCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const items = [...SHOWCASE_SUBSCRIPTIONS, ...SHOWCASE_SUBSCRIPTIONS];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    let offset = 0;
    const speed = 0.6;

    const tick = () => {
      if (!paused) {
        offset += speed;
        const half = track.scrollWidth / 2;
        if (offset >= half) offset = 0;
        track.style.transform = `translateX(-${offset}px)`;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  return (
    <section id="showcase" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 max-w-2xl"
        >
          <p className="text-sm font-medium text-cyan-300">Subscription showcase</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Every recurring charge. One endless stream.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Streaming, internet, SaaS, gaming, and utilities — visualized the way
            a modern finance stack should feel.
          </p>
        </motion.div>
      </div>

      <div
        className="relative overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />
        <div ref={trackRef} className="flex w-max gap-4 px-4 will-change-transform">
          {items.map((item, index) => (
            <SubscriptionCard key={`${item.name}-${index}`} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
