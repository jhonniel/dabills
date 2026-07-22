import { listAdminActivity } from "@/features/admin/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AdminLogsPage() {
  const { items } = await listAdminActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Activity logs
        </h1>
        <p className="mt-2 text-muted-foreground">
          Audit trail for admin actions across users, invites, and payments.
        </p>
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Audit feed</CardTitle>
          <CardDescription>{items.length} recorded events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{log.action}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Actor {log.actor_id ?? "system"}
                    {log.entity_type ? ` · ${log.entity_type}` : ""}
                    {log.entity_id ? ` · ${log.entity_id}` : ""}
                  </p>
                  {log.metadata && (
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
