import { NextResponse } from "next/server";

import { refreshBillStatusesAction } from "@/features/billing/actions";

/** Cron-ready status refresh: upcoming → pending → overdue */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshBillStatusesAction();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    job: "refresh-bill-statuses",
    ...result.data,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
