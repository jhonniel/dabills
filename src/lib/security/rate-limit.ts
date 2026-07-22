/**
 * Lightweight in-memory rate limiter for serverless / Node runtimes.
 * Suitable for single-instance and soft abuse protection.
 * For multi-region production, swap for Redis / Upstash.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { success: true; remaining: number; resetAt: number }
  | { success: false; remaining: 0; resetAt: number; retryAfterSec: number };

export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(input.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + input.windowMs;
    buckets.set(input.key, { count: 1, resetAt });
    return { success: true, remaining: input.limit - 1, resetAt };
  }

  if (existing.count >= input.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(input.key, existing);
  return {
    success: true,
    remaining: input.limit - existing.count,
    resetAt: existing.resetAt,
  };
}

export function clientKeyFromHeaders(headers: Headers, prefix: string) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip");
  const ip = forwarded || realIp || "unknown";
  return `${prefix}:${ip}`;
}
