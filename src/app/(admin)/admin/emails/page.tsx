import { listAdminEmails } from "@/features/admin/queries";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default async function AdminEmailsPage() {
  const { items } = await listAdminEmails();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Email history
        </h1>
        <p className="mt-2 text-muted-foreground">
          Delivery log for reminders, payment emails, and invites.
        </p>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Outbound emails</CardTitle>
          <CardDescription>{items.length} logged messages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No emails logged yet. Process reminders or settle payments to generate
              entries.
            </p>
          )}
          {items.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{log.subject}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    To {log.to_email} · {log.template}
                  </p>
                  {log.error && (
                    <p className="mt-1 text-xs text-rose-300">{log.error}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    log.status === "sent" &&
                      "border-teal-400/30 bg-teal-400/10 text-teal-200",
                    log.status === "failed" &&
                      "border-rose-400/30 bg-rose-400/10 text-rose-200"
                  )}
                >
                  {log.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
