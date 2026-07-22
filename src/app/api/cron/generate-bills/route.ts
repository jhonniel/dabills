import { NextResponse } from "next/server";

import { generateUpcomingBillsAction } from "@/features/billing/actions";

/**
 * Cron-ready endpoint for recurring bill generation.
 * Secure with CRON_SECRET header in production (Vercel Cron / external scheduler).
 *
 * Example:
 * Authorization: Bearer $CRON_SECRET
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateUpcomingBillsAction({
    horizonDays: 90,
    maxCycles: 6,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    job: "generate-bills",
    ...result.data,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
