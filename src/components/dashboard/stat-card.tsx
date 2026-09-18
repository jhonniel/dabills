import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatCard({
  title,
  value,
  hint,
  accent,
}: {
  title: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("font-display text-2xl font-semibold tracking-tight", accent)}>
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function AnimatedCurrency({
  amount,
  currency = DEFAULT_CURRENCY,
}: {
  amount: number;
  currency?: string;
}) {
  return (
    <span>
      {new Intl.NumberFormat(DEFAULT_LOCALE, {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount)}
    </span>
  );
}
