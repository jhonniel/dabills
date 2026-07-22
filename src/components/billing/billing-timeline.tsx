import type { BillingCycleWithSubscription } from "@/features/billing/queries";
import type { ReminderScheduleItem } from "@/lib/billing/reminders";
import { formatMoney } from "@/lib/billing/expenses";
import { BillStatusBadge } from "@/components/billing/bill-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BillingTimeline({
  items,
}: {
  items: BillingCycleWithSubscription[];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-16 text-center">
        <p className="font-display text-lg font-semibold">No timeline events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="relative pl-6">
          <span className="absolute top-1.5 left-0 size-2.5 rounded-full bg-cyan-400" />
          {index < items.length - 1 && (
            <span className="absolute top-4 left-[4px] h-[calc(100%-4px)] w-px bg-white/10" />
          )}
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{item.subscription?.name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground">
                  Due {item.due_date} · {item.period_start} → {item.period_end}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-semibold">
                  {formatMoney(item.amount, item.currency)}
                </span>
                <BillStatusBadge status={item.status} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReminderScheduleCard({
  reminders,
}: {
  reminders: ReminderScheduleItem[];
}) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="font-display text-lg">Reminder schedule</CardTitle>
        <CardDescription>
          Cron-ready plan for 5 / 3 / 1 day, due today, and overdue alerts (Phase 5
          will send these).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No reminders scheduled in the next window.
          </p>
        )}
        {reminders.slice(0, 8).map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium capitalize">
                {reminder.type.replaceAll("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                Send {reminder.scheduled_for} · due {reminder.due_date}
              </p>
            </div>
            <Badge variant="outline" className="capitalize">
              {reminder.channel}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
