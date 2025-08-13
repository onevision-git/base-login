// src/lib/rateLimit.ts
// Simple in-memory rate limiter (good for dev / single instance).
// For production (serverless or multi-instance), swap this with Redis/Upstash.

type Bucket = { resetAt: number; count: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  reset: number; // epoch ms
};

/**
 * Check and increment a rate limit bucket for the given key.
 * @param key Unique identifier (e.g., ip:email)
 * @param limit Max requests per window
 * @param windowMs Window size in ms
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    const next: Bucket = { resetAt, count: 1 };
    buckets.set(key, next);
    return { allowed: true, remaining: limit - 1, limit, reset: resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, limit, reset: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    limit,
    reset: bucket.resetAt,
  };
}

/**
 * Utility to format standard rate-limit headers.
 */
export function rateLimitHeaders(res: RateLimitResult): HeadersInit {
  // Using common header names; adjust to your preference if needed.
  return {
    'x-ratelimit-limit': String(res.limit),
    'x-ratelimit-remaining': String(res.remaining),
    'x-ratelimit-reset': String(Math.ceil(res.reset / 1000)), // seconds
  };
}
