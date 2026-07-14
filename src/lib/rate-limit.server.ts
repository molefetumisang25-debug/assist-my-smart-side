// Simple in-memory sliding-window rate limiter. Best-effort per-instance;
// suitable as a lightweight abuse guard for AI endpoints.
const buckets = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const arr = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (arr.length >= limit) {
    const retryAfter = Math.max(1, Math.ceil((arr[0] + windowMs - now) / 1000));
    buckets.set(key, arr);
    return { ok: false, retryAfter };
  }
  arr.push(now);
  buckets.set(key, arr);
  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      const filtered = v.filter((t) => t > cutoff);
      if (filtered.length === 0) buckets.delete(k);
      else buckets.set(k, filtered);
    }
  }
  return { ok: true, retryAfter: 0 };
}
