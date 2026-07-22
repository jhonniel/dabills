import type { SubscriptionStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<SubscriptionStatus, string> = {
  active: "border-teal-400/30 bg-teal-400/10 text-teal-200",
  paused: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  cancelled: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", styles[status])}
    >
      {status}
    </Badge>
  );
}
