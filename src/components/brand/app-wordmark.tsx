import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { className: "h-7 w-auto", width: 250, height: 70 },
  md: { className: "h-8 w-auto", width: 286, height: 80 },
  lg: { className: "h-10 w-auto", width: 357, height: 100 },
  hero: { className: "h-12 w-auto max-w-full sm:h-[4.5rem] lg:h-24", width: 480, height: 135 },
} as const;

/** Cache-bust when logo assets are updated */
const WORDMARK_SRC = "/logo-wordmark.png?v=3";

/** Full brand mark (icon + dabills wordmark) — plain img to preserve PNG alpha */
export function AppWordmark({
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
    // eslint-disable-next-line @next/next/no-img-element -- keep raw PNG alpha (next/image optimizer was matting black)
    <img
      src={WORDMARK_SRC}
      alt={APP_NAME}
      width={conf.width}
      height={conf.height}
      className={cn("bg-transparent", conf.className, className)}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
    />
  );
}
