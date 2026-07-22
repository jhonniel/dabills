import { NextResponse } from "next/server";

import { getScheduledRemindersAction } from "@/features/billing/actions";

/**
 * Cron-ready reminder planner.
 * Phase 5 will send emails/notifications from this schedule.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getScheduledRemindersAction();
  if (!result.success) {
    return NextResponse.json({ error: "Failed to build schedule" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    job: "schedule-reminders",
    count: result.data.length,
    reminders: result.data,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
