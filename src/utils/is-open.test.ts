import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- Run through tsx with Node's test runner.
import { test } from 'node:test'

import { getIsOpen, getMaineClock } from './is-open'

test('Maine clock uses local weekday and observes daylight saving time', () => {
  assert.deepEqual(getMaineClock(new Date('2026-11-28T02:30:00Z')), { day: 5, time: '21:30' })
  assert.deepEqual(getMaineClock(new Date('2026-07-03T16:00:00Z')), { day: 5, time: '12:00' })
})

test('opening status respects opening and closing boundaries in Maine', () => {
  const hours = [{ day: 5, open: '09:00', close: '17:00' }]
  assert.equal(getIsOpen(hours, new Date('2026-11-27T13:59:00Z')), false)
  assert.equal(getIsOpen(hours, new Date('2026-11-27T14:00:00Z')), true)
  assert.equal(getIsOpen(hours, new Date('2026-11-27T22:00:00Z')), false)
})

test('overnight hours extend into the next day, including the week boundary', () => {
  const hours = [{ day: 6, open: '18:00', close: '01:00' }, { day: 0, open: '00:00', close: '00:00' }]
  assert.equal(getIsOpen(hours, new Date('2026-11-29T04:30:00Z')), true)
  assert.equal(getIsOpen(hours, new Date('2026-11-29T05:30:00Z')), true)
  assert.equal(getIsOpen(hours, new Date('2026-11-29T06:00:00Z')), false)
  assert.equal(getIsOpen(null), false)
  assert.equal(getIsOpen([]), false)
})
