import { NextResponse } from "next/server";

import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import { activeOcrProviderLabel, isLiveOcrEnabled } from "@/services/ocr/config";

export async function GET() {
  const emailConfigured = Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL &&
      !process.env.RESEND_API_KEY.includes("xxxxxxxx")
  );

  return NextResponse.json({
    status: "ok",
    service: "dabills",
    phase: 7,
    checks: {
      supabaseConfigured: isSupabaseConfigured(),
      emailConfigured,
      ocrProvider: activeOcrProviderLabel(),
      ocrLive: isLiveOcrEnabled(),
      cronSecretConfigured: Boolean(
        process.env.CRON_SECRET &&
          process.env.CRON_SECRET !== "change-me-in-production"
      ),
      appUrl: getAppUrl(),
    },
    timestamp: new Date().toISOString(),
  });
}
