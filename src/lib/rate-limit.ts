/**
 * Simple in-memory IP-based rate limiter for Vercel serverless functions.
 *
 * Limits are per-instance (not shared across cold starts), so this provides
 * per-container protection rather than global rate limiting. For global
 * limits, use Vercel KV or an external store.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   if (limiter.isLimited(ip)) return new Response("Too many requests", { status: 429 });
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  windowMs: number;
  max: number;
}

interface RateLimiter {
  isLimited: (key: string) => boolean;
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const map = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of map) {
      if (now > entry.resetAt) map.delete(key);
    }
  }, 5 * 60_000);

  return {
    isLimited(key: string): boolean {
      const now = Date.now();
      const entry = map.get(key);
      if (!entry || now > entry.resetAt) {
        map.set(key, { count: 1, resetAt: now + config.windowMs });
        return false;
      }
      entry.count++;
      return entry.count > config.max;
    },
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
  );
}
