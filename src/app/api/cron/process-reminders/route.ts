import { NextResponse } from "next/server";

import { processDueRemindersAction } from "@/features/notifications/actions";

/**
 * Processes due reminder schedule items into in-app notifications + emails.
 * Secure with CRON_SECRET in production.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processDueRemindersAction({ onlyToday: true });
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    job: "process-reminders",
    ...result.data,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
