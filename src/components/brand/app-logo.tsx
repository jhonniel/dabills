import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-7", px: 28 },
  md: { box: "size-8", px: 32 },
  lg: { box: "size-10", px: 40 },
} as const;

const LOGO_SRC = "/logo.png?v=3";

export function AppLogo({
  size = "md",
  className,
  priority = false,
}: {
  size?: keyof typeof SIZES;
  className?: string;
  priority?: boolean;
}) {
  const conf = SIZES[size];
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-xl bg-transparent",
        conf.box,
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- keep raw PNG alpha */}
      <img
        src={LOGO_SRC}
        alt="DaBills"
        width={conf.px}
        height={conf.px}
        className="size-full bg-transparent object-contain"
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      />
    </span>
  );
}
