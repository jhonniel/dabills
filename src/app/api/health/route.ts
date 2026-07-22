import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "dabills",
    phase: 1,
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
  });
}
