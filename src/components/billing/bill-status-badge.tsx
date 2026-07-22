import type { BillStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<BillStatus, string> = {
  upcoming: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  overdue: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  pending_verification: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  paid: "border-teal-400/30 bg-teal-400/10 text-teal-200",
  failed: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
};

export function BillStatusBadge({ status }: { status: BillStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status])}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
