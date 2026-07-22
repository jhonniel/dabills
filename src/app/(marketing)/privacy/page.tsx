import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-28">
      <h1 className="font-display text-4xl font-semibold tracking-tight">
        Privacy Policy
      </h1>
      <p className="mt-4 text-muted-foreground">
        DaBills collects account information, subscription data you provide, and
        payment receipt metadata required to operate the product. Full legal
        copy will be finalized before production launch (Phase 7).
      </p>
      <Link href="/" className="mt-8 inline-block text-cyan-300 hover:underline">
        Back home
      </Link>
    </div>
  );
}
