import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Phase 1 foundation is ready. Subscription management, charts, and
          analytics arrive in Phase 2.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Upcoming Bills", value: "—", hint: "Phase 3" },
          { title: "Monthly Cost", value: "—", hint: "Phase 2" },
          { title: "Yearly Cost", value: "—", hint: "Phase 2" },
          { title: "Active Subscriptions", value: "—", hint: "Phase 2" },
        ].map((item) => (
          <Card
            key={item.title}
            className="border-white/10 bg-white/[0.03] backdrop-blur-md"
          >
            <CardHeader className="pb-2">
              <CardDescription>{item.title}</CardDescription>
              <CardTitle className="font-display text-2xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display">What&apos;s next</CardTitle>
          <CardDescription>
            Connect Supabase credentials in `.env.local`, run the migrations in
            `supabase/migrations`, then continue to Phase 2 for full subscription
            CRUD and analytics.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
