export default function AdminLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-2xl border border-border/60 bg-muted/40" />
      <span className="sr-only">Loading admin…</span>
    </div>
  );
}
