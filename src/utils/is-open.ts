import type { RestaurantSchema } from './zod/restaurant-schema'

export function getIsOpen(hours: RestaurantSchema['opening_hours']) {
  if (!hours) {
    return false
  }
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const todaySchedule = hours[currentDay]

  return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
}
