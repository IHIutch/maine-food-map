/** PROTOTYPE — variant list for the map-pin comparison. */
export const PIN_VARIANTS = ['off', 'A', 'B', 'C', 'D'] as const
export type PinVariant = (typeof PIN_VARIANTS)[number]

export const PIN_NAMES: Record<PinVariant, string> = {
  off: 'Shipped dot (blue)',
  A: 'Dot',
  B: 'Price pill',
  C: 'Cuisine teardrop',
  D: 'Open-now status',
}
