import { headers } from "next/headers";

import {
  clientKeyFromHeaders,
  rateLimit,
  type RateLimitResult,
} from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/request";

export async function enforceMutationGuard(input: {
  action: string;
  limit?: number;
  windowMs?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const origin = await assertSameOrigin();
  if (!origin.ok) return origin;

  const headerStore = await headers();
  const key = clientKeyFromHeaders(headerStore, input.action);
  const result: RateLimitResult = rateLimit({
    key,
    limit: input.limit ?? 20,
    windowMs: input.windowMs ?? 60_000,
  });

  if (!result.success) {
    return {
      ok: false,
      error: `Too many requests. Try again in ${result.retryAfterSec}s.`,
    };
  }

  return { ok: true };
}
