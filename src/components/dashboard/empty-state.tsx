import { type LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <Icon className="size-5 text-cyan-300/90" />
      </div>
      <p className="mt-4 font-display text-base font-semibold text-foreground">
        {title}
      </p>
      <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button
          asChild
          variant="outline"
          className="mt-5 h-10 rounded-xl border-white/10"
        >
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
