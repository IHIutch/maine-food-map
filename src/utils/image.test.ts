import { describe, expect, it } from 'vitest'

import { nextAttempt } from './image'

const OPTS = { maxEdge: 2048, maxBytes: 1_000_000 }

describe('nextAttempt', () => {
  it('keeps the current attempt when the blob already fits', () => {
    expect(nextAttempt(900_000, 0.85, 2048, OPTS)).toEqual({
      q: 0.85,
      edge: 2048,
    })
  })

  it('steps quality down by 0.1 from the 0.85 start', () => {
    expect(nextAttempt(2_000_000, 0.85, 2048, OPTS)).toEqual({
      q: 0.75,
      edge: 2048,
    })
  })

  it('walks the full quality ladder down to the 0.4 floor', () => {
    const qs = []
    let attempt = { q: 0.85, edge: 2048 }
    for (;;) {
      const next = nextAttempt(2_000_000, attempt.q, attempt.edge, OPTS)
      if (next === 'fail' || next.edge !== 2048) break
      attempt = next
      qs.push(next.q)
    }
    expect(qs).toEqual([0.75, 0.65, 0.55, 0.45, 0.4])
  })

  it('halves dimensions once and restarts quality after the floor', () => {
    expect(nextAttempt(2_000_000, 0.4, 2048, OPTS)).toEqual({
      q: 0.85,
      edge: 1024,
    })
  })

  it('fails at the quality floor once dimensions are already halved', () => {
    expect(nextAttempt(2_000_000, 0.4, 1024, OPTS)).toBe('fail')
  })

  it('never loops: every over-budget path reaches fail', () => {
    let attempt: { q: number; edge: number } | 'fail' = {
      q: 0.85,
      edge: 2048,
    }
    let steps = 0
    while (attempt !== 'fail') {
      attempt = nextAttempt(2_000_000, attempt.q, attempt.edge, OPTS)
      steps += 1
      expect(steps).toBeLessThan(20)
    }
    expect(steps).toBe(12)
  })
})
