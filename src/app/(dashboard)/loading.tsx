export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
