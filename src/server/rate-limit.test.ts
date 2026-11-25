import { describe, expect, it, vi } from 'vitest'

// These modules only exist in the Workers runtime (or need a live DB) —
// mock them so the pure code under test is importable in vitest
vi.mock('cloudflare:workers', () => ({ env: {} }))
vi.mock('../utils/prisma', () => ({ prisma: {} }))
vi.mock('./session', () => ({ getCurrentUser: async () => null }))

import { countRequest } from './rate-limit'
import { submitReportInput } from './reports'

/* Mock KV: a Map plus manual ttl bookkeeping, driven through countRequest
 * the same way assertRateLimit drives the real KV. */
function makeStore() {
  const entries = new Map<string, { value: string; expiresAt: number }>()
  return {
    get(key: string, now: number): string | null {
      const entry = entries.get(key)
      if (!entry || entry.expiresAt <= now) return null
      return entry.value
    },
    put(key: string, value: string, ttlSeconds: number, now: number): void {
      entries.set(key, { value, expiresAt: now + ttlSeconds })
    },
  }
}

function hit(
  store: ReturnType<typeof makeStore>,
  key: string,
  limit: number,
  windowSeconds: number,
  now: number,
): boolean {
  const decision = countRequest(store.get(key, now), limit, windowSeconds, now)
  store.put(key, decision.value, decision.ttlSeconds, now)
  return decision.allowed
}

describe('countRequest', () => {
  it('allows requests under the limit', () => {
    const store = makeStore()
    expect(hit(store, 'rl:report:1.2.3.4', 3, 3600, 1000)).toBe(true)
    expect(hit(store, 'rl:report:1.2.3.4', 3, 3600, 1001)).toBe(true)
  })

  it('allows the request exactly at the limit', () => {
    const store = makeStore()
    hit(store, 'k', 3, 3600, 1000)
    hit(store, 'k', 3, 3600, 1001)
    expect(hit(store, 'k', 3, 3600, 1002)).toBe(true)
  })

  it('rejects requests over the limit', () => {
    const store = makeStore()
    for (let i = 0; i < 3; i++) hit(store, 'k', 3, 3600, 1000 + i)
    expect(hit(store, 'k', 3, 3600, 1003)).toBe(false)
    expect(hit(store, 'k', 3, 3600, 1004)).toBe(false)
  })

  it('resets the count once the window expires', () => {
    const store = makeStore()
    for (let i = 0; i < 4; i++) hit(store, 'k', 3, 3600, 1000 + i)
    expect(hit(store, 'k', 3, 3600, 1000 + 3600)).toBe(true)
  })

  it('keeps the fixed window: later hits do not extend resetAt', () => {
    const store = makeStore()
    hit(store, 'k', 1, 3600, 1000)
    // Hits mid-window are rejected but must not push the reset out
    hit(store, 'k', 1, 3600, 3000)
    expect(hit(store, 'k', 1, 3600, 1000 + 3600)).toBe(true)
  })

  it('starts fresh on an unparseable stored value', () => {
    const decision = countRequest('not-json', 3, 3600, 1000)
    expect(decision.allowed).toBe(true)
    expect(JSON.parse(decision.value)).toEqual({ n: 1, resetAt: 4600 })
  })

  it('never writes a TTL under the KV minimum of 60s', () => {
    const first = countRequest(null, 5, 3600, 1000)
    // 10s before the window ends
    const late = countRequest(first.value, 5, 3600, 4590)
    expect(late.ttlSeconds).toBe(60)
  })
})

describe('submitReport input validation', () => {
  const validate = (input: unknown) => submitReportInput.parse(input)

  const valid = {
    kind: 'place_error',
    reason: 'closed',
    restaurantPublicId: 'abc123',
  }

  it('accepts a valid payload', () => {
    expect(() => validate(valid)).not.toThrow()
  })

  it('rejects an invalid reason', () => {
    expect(() => validate({ ...valid, reason: 'spite' })).toThrow()
  })

  it('rejects overlong details', () => {
    expect(() => validate({ ...valid, details: 'x'.repeat(2001) })).toThrow()
  })
})
