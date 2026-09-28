"use client";

import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const motion =
  "transition-[transform,opacity,grid-template-rows] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

export function MobileMenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-11"
      onClick={onClick}
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      <span className="relative size-5">
        <Menu
          className={cn(
            "absolute inset-0 size-5",
            motion,
            open ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"
          )}
        />
        <X
          className={cn(
            "absolute inset-0 size-5",
            motion,
            open ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0"
          )}
        />
      </span>
    </Button>
  );
}

export function MobileMenuPanel({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid",
        motion,
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className="overflow-hidden">
        <div
          inert={open ? undefined : true}
          className={cn(
            "safe-px max-h-[min(70dvh,calc(100dvh-3.5rem))] overflow-y-auto overscroll-contain border-t border-white/[0.06] py-4 pb-drawer-nav",
            motion,
            open ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
