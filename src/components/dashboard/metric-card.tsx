import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c121c]/80 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            <Icon className="size-4 text-cyan-300/80" />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-3 font-display text-2xl font-semibold tracking-tight tabular-nums",
          accent ? "text-cyan-300" : "text-foreground"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
