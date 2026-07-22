"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#070b12] px-4 text-center text-[#e8eef7]">
        <h1 className="text-2xl font-bold">Application error</h1>
        <p className="mt-2 max-w-md text-sm text-[#9aa7b8]">
          A critical error occurred. You can try recovering the page.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-black"
        >
          Try again
        </button>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-[#6b7787]">
            Ref: {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
