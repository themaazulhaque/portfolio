import 'server-only';

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Simple in-memory sliding bucket rate limiter.
 * Suitable for single-process self-hosted deployments; swap for a shared
 * store (Redis) if deploying to multiple serverless instances.
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number }
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { allowed: true, remaining: opts.limit - 1, retryAfterSec: 0 };
  }

  if (bucket.count >= opts.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: opts.limit - bucket.count, retryAfterSec: 0 };
}

export function resetRateLimit(key: string): void {
  store.delete(key);
}
