interface OpeningHours {
  day: number
  open: string
  close: string
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const maineClock = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function getMaineClock(now = new Date()) {
  const parts = maineClock.formatToParts(now)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value ?? ''
  return { day: weekdays.indexOf(part('weekday')), time: `${part('hour')}:${part('minute')}` }
}

export function getIsOpen(hours: OpeningHours[] | null | undefined, now = new Date()) {
  if (!hours)
    return false
  const { day, time } = getMaineClock(now)
  const today = hours.find(schedule => schedule.day === day)
  const yesterday = hours.find(schedule => schedule.day === (day + 6) % 7)
  if (yesterday && yesterday.open > yesterday.close && time < yesterday.close)
    return true
  if (!today || today.open === today.close)
    return false
  return today.open < today.close
    ? time >= today.open && time < today.close
    : time >= today.open
}
