import { describe, expect, it } from 'vitest'
import { computeIsOpen, formatTodayHours, getMaineNow, isOpenAt } from './opening-hours'

describe('getMaineNow', () => {
  it('handles EDT and the UTC day-boundary crossing', () => {
    expect(getMaineNow(new Date('2026-07-19T01:30:00Z'))).toEqual({ day: 6, time: '21:30' })
  })

  it('handles EST (DST)', () => {
    expect(getMaineNow(new Date('2026-01-19T01:30:00Z'))).toEqual({ day: 0, time: '20:30' })
  })
})

describe('isOpenAt', () => {
  const schedule = { day: 1, open: '11:00', close: '21:00' }

  it('is open within the window', () => {
    expect(isOpenAt(schedule, '12:00')).toBe(true)
  })

  it('is closed after the window', () => {
    expect(isOpenAt(schedule, '22:00')).toBe(false)
  })

  it('is closed before the window', () => {
    expect(isOpenAt(schedule, '10:59')).toBe(false)
  })

  it('treats the 00:00/00:00 sentinel as closed', () => {
    expect(isOpenAt({ day: 1, open: '00:00', close: '00:00' }, '12:00')).toBe(false)
  })

  it('handles overnight schedules', () => {
    const overnight = { day: 5, open: '17:00', close: '01:00' }
    expect(isOpenAt(overnight, '23:30')).toBe(true)
    expect(isOpenAt(overnight, '00:30')).toBe(true)
    expect(isOpenAt(overnight, '12:00')).toBe(false)
  })
})

describe('computeIsOpen', () => {
  it('is open past midnight via the previous day overnight spillover', () => {
    const hours = [
      { day: 0, open: '00:00', close: '00:00' },
      { day: 1, open: '00:00', close: '00:00' },
      { day: 2, open: '00:00', close: '00:00' },
      { day: 3, open: '00:00', close: '00:00' },
      { day: 4, open: '00:00', close: '00:00' },
      { day: 5, open: '17:00', close: '01:00' },
      { day: 6, open: '00:00', close: '00:00' },
    ]
    expect(computeIsOpen(hours, new Date('2026-07-18T04:30:00Z'))).toBe(true)
  })

  it('is closed when hours are null', () => {
    expect(computeIsOpen(null)).toBe(false)
  })
})

describe('formatTodayHours', () => {
  it('is null when hours are absent', () => {
    expect(formatTodayHours(null)).toBeNull()
  })

  it('formats a closed day', () => {
    const hours = [{ day: 1, open: '00:00', close: '00:00' }]
    expect(formatTodayHours(hours, new Date('2026-07-20T15:00:00Z'))).toBe('Closed')
  })

  it('formats an open day', () => {
    const hours = [{ day: 1, open: '11:00', close: '21:00' }]
    expect(formatTodayHours(hours, new Date('2026-07-20T15:00:00Z'))).toBe('11:00 - 21:00')
  })
})
