const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

type Counter = { count: number; resetAt: number };

function store(): Map<string, Counter> {
  const g = globalThis as unknown as { __medbridge_rateLimit?: Map<string, Counter> };
  if (!g.__medbridge_rateLimit) g.__medbridge_rateLimit = new Map();
  return g.__medbridge_rateLimit;
}

export function getClientIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

export function rateLimitOrThrow(args: { req: Request; key: string }) {
  const ip = getClientIp(args.req);
  const now = Date.now();
  const map = store();
  const bucketKey = `${args.key}:${ip}`;
  const current = map.get(bucketKey);
  if (!current || current.resetAt <= now) {
    map.set(bucketKey, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  current.count += 1;
  if (current.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    const err = new Error("Rate limit exceeded");
    (err as Error & { status?: number; retryAfter?: number }).status = 429;
    (err as Error & { status?: number; retryAfter?: number }).retryAfter = retryAfter;
    throw err;
  }
}

