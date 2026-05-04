/**
 * In-memory sliding-window rate limiter, keyed by client IP.
 *
 * Single-instance only — for serverless / multi-instance production use Redis.
 * Adequate for MVP where login is the highest-risk endpoint.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

interface Bucket {
  count: number;
  firstAt: number;
}

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 1024) return;
  for (const [k, v] of buckets) {
    if (now - v.firstAt > WINDOW_MS) buckets.delete(k);
  }
}

export function checkRate(key: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  prune(now);

  const b = buckets.get(key);
  if (!b || now - b.firstAt > WINDOW_MS) {
    return { allowed: true, retryAfter: 0 };
  }
  if (b.count >= MAX_FAILED_ATTEMPTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((b.firstAt + WINDOW_MS - now) / 1000),
    };
  }
  return { allowed: true, retryAfter: 0 };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.firstAt > WINDOW_MS) {
    buckets.set(key, { count: 1, firstAt: now });
    return;
  }
  b.count += 1;
}

export function resetAttempts(key: string): void {
  buckets.delete(key);
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
