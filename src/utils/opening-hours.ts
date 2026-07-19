export type DaySchedule = { day: number; open: string; close: string }

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

// Current time in the restaurant's timezone (all restaurants are in Maine).
// Uses Intl (available in Cloudflare Workers) — NEVER new Date().getHours(),
// which is UTC on Workers.
export function getMaineNow(now: Date = new Date()): { day: number; time: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const weekday = parts.find((p) => p.type === 'weekday')!.value
  let hour = parts.find((p) => p.type === 'hour')!.value
  const minute = parts.find((p) => p.type === 'minute')!.value

  if (hour === '24') hour = '00'

  return {
    day: WEEKDAY_TO_INDEX[weekday],
    time: `${hour}:${minute}`,
  }
}

// True when `time` ("HH:MM") falls in the schedule, handling:
// - closed sentinel: open==="00:00" && close==="00:00" → false
// - normal: time >= open && time <= close
// - overnight (close < open): time >= open || time <= close
export function isOpenAt(schedule: DaySchedule | undefined, time: string): boolean {
  if (!schedule) return false
  const { open, close } = schedule
  if (open === '00:00' && close === '00:00') return false
  if (close < open) return time >= open || time <= close
  return time >= open && time <= close
}

// Overall status: open now if today's schedule says open at `time`, OR
// yesterday's schedule is overnight and still spilling past midnight
// (e.g. Fri 17:00–01:00 means open Sat 00:30).
export function computeIsOpen(hours: DaySchedule[] | null, now: Date = new Date()): boolean {
  if (!hours) return false
  const { day, time } = getMaineNow(now)

  const today = hours.find((s) => s.day === day)
  if (isOpenAt(today, time)) return true

  const yesterdayIndex = (day + 6) % 7
  const yesterday = hours.find((s) => s.day === yesterdayIndex)
  if (yesterday && yesterday.close < yesterday.open) {
    return time <= yesterday.close
  }

  return false
}

// "Closed" | "HH:MM - HH:MM" | null (null when hours are absent)
export function formatTodayHours(hours: DaySchedule[] | null, now: Date = new Date()): string | null {
  if (!hours) return null
  const { day } = getMaineNow(now)
  const today = hours.find((s) => s.day === day)
  if (!today) return null
  if (today.open === '00:00' && today.close === '00:00') return 'Closed'
  return `${today.open} - ${today.close}`
}
