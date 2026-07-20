import { getRequestHeader } from '@tanstack/react-start/server'

// KV is eventually consistent, so this counter is best-effort damping
// against abuse, not a hard guarantee.

type StoredCount = { n: number; resetAt: number }

export type RateLimitDecision = {
  allowed: boolean
  value: string
  ttlSeconds: number
}

/* Pure counting decision: given the raw stored value, return whether this
 * request is allowed plus the next value/TTL to write. Fixed window — the
 * stored resetAt keeps later writes from extending the window. */
export function countRequest(
  raw: string | null,
  limit: number,
  windowSeconds: number,
  nowSeconds: number,
): RateLimitDecision {
  let n = 0
  let resetAt = nowSeconds + windowSeconds
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw) as Partial<StoredCount>
      if (
        typeof parsed.n === 'number' &&
        typeof parsed.resetAt === 'number' &&
        parsed.resetAt > nowSeconds
      ) {
        n = parsed.n
        resetAt = parsed.resetAt
      }
    } catch {
      // Unparseable value — start a fresh window
    }
  }
  n += 1
  return {
    allowed: n <= limit,
    value: JSON.stringify({ n, resetAt } satisfies StoredCount),
    // KV rejects TTLs under 60 seconds
    ttlSeconds: Math.max(resetAt - nowSeconds, 60),
  }
}

export async function assertRateLimit(
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  // Lazy import keeps this module loadable outside the Workers runtime (vitest)
  const { env } = await import('cloudflare:workers')
  const ip = getRequestHeader('cf-connecting-ip') ?? 'local'
  const key = `rl:${bucket}:${ip}`
  const raw = await env.LIKES_CACHE.get(key)
  const decision = countRequest(
    raw,
    limit,
    windowSeconds,
    Math.floor(Date.now() / 1000),
  )
  await env.LIKES_CACHE.put(key, decision.value, {
    expirationTtl: decision.ttlSeconds,
  })
  if (!decision.allowed) throw new Error('RATE_LIMITED')
}
