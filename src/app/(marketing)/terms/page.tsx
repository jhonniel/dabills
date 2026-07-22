import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-28">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Terms of Service
      </h1>
      <p className="mt-4 text-muted-foreground">
        By using DaBills you agree to invite-only access rules, acceptable use of
        billing data, and the platform policies. Final terms will ship with Phase
        7 production documentation.
      </p>
      <Link href="/" className="mt-8 inline-block text-cyan-300 hover:underline">
        Back home
      </Link>
    </div>
  );
}
