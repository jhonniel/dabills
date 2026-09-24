"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DaBills error]", error.message, error.digest, error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-sm font-semibold tracking-wide text-cyan-400">
        Something went wrong
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        We hit an unexpected error
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Try again. If it keeps happening, refresh the page or return home.
      </p>
      {isDev && error.message ? (
        <pre className="mt-4 max-w-lg whitespace-pre-wrap rounded-xl border border-rose-400/30 bg-rose-950/40 px-4 py-3 text-left font-mono text-xs text-rose-100">
          {error.message}
        </pre>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          Ref: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
