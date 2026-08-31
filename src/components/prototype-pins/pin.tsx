/**
 * PROTOTYPE — four map pins on the live map, switched by `?variant=`.
 *
 *   A  Dot          the shipped marker, on the blueberry palette
 *   B  Price pill   the number you're deciding on, rendered in the pin
 *   C  Cuisine pin  a teardrop carrying what kind of place it is
 *   D  Open status  filled when it's open now, hollow when it isn't
 *
 * Question: at 500-odd markers over Greater Portland, which reads without
 * clicking — and which turns to mush when they overlap?
 */

import type { PinVariant } from './variants'

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

/** Coarse buckets — a pin can carry an idea, not a taxonomy. */
const CUISINE_ICONS: { match: string[], icon: string }[] = [
  { match: ['seafood', 'oyster', 'fish'], icon: 'icon-[material-symbols--set-meal-rounded]' },
  { match: ['coffee', 'tea', 'juice'], icon: 'icon-[material-symbols--local-cafe-rounded]' },
  { match: ['breweries', 'beer', 'pubs', 'bars', 'wine', 'cider'], icon: 'icon-[material-symbols--sports-bar-rounded]' },
  { match: ['bakeries', 'doughnut', 'candy', 'ice-cream', 'gelato'], icon: 'icon-[material-symbols--bakery-dining-rounded]' },
  { match: ['pizzerias'], icon: 'icon-[material-symbols--local-pizza-rounded]' },
  { match: ['food-trucks', 'food-carts'], icon: 'icon-[material-symbols--local-shipping-rounded]' },
  { match: ['markets', 'grocery', 'specialty'], icon: 'icon-[material-symbols--storefront-rounded]' },
]

function iconFor(cuisineSlugs: string[]) {
  for (const entry of CUISINE_ICONS) {
    if (cuisineSlugs.some(slug => entry.match.some(needle => slug.includes(needle))))
      return entry.icon
  }
  return 'icon-[material-symbols--restaurant-rounded]'
}

export interface PinPlace {
  price_level?: string | null
  cuisineSlugs?: string[]
  isOpen: boolean
}

export default function PrototypePin({ variant, place, isSelected }: {
  variant: PinVariant
  place: PinPlace
  isSelected: boolean
}) {
  if (variant === 'B') {
    const price = place.price_level ? PRICE_LABELS[place.price_level] : null
    return (
      <div
        className={`cursor-pointer rounded-full border px-2 py-0.5 font-mono text-[11px] font-medium shadow-sm transition-all ${
          isSelected
            ? 'scale-110 border-blueberry-700 bg-blueberry-600 text-white'
            : 'border-stone-300 bg-white text-stone-900 hover:scale-105'
        }`}
      >
        {price ?? '·'}
      </div>
    )
  }

  if (variant === 'C') {
    // One path, one stroke: a head and tail drawn separately leave a seam where
    // the head's ring crosses the neck, which is the clipping you saw.
    return (
      <div className={`relative h-12 w-[38px] cursor-pointer transition-transform ${isSelected ? 'scale-110' : 'hover:scale-105'}`}>
        <svg viewBox="0 0 38 48" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden>
          <path
            d="M19 46.5C19 46.5 4 28.5 4 19a15 15 0 1 1 30 0c0 9.5-15 27.5-15 27.5Z"
            className={isSelected ? 'fill-stone-900' : 'fill-blueberry-500'}
            stroke="#fff"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className={`absolute left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-white ${iconFor(place.cuisineSlugs ?? [])}`}
          style={{ top: 19 }}
        />
      </div>
    )
  }

  if (variant === 'D') {
    return (
      <div
        className={`cursor-pointer rounded-full border-2 shadow-sm transition-all ${
          isSelected ? 'size-5 scale-110' : 'size-3.5 hover:scale-110'
        } ${
          place.isOpen
            ? 'border-white bg-green-600'
            : 'border-stone-400 bg-white'
        } ${isSelected ? 'ring-2 ring-blueberry-500 ring-offset-1' : ''}`}
      />
    )
  }

  // A — the shipped shape, on palette
  return (
    <div
      className={`cursor-pointer rounded-full border-2 border-white shadow-sm transition-all ${
        isSelected ? 'size-5 scale-110 bg-stone-900' : 'size-3.5 bg-blueberry-500 hover:scale-110'
      }`}
    />
  )
}
