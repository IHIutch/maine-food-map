/**
 * PROTOTYPE — throwaway. Shared search plumbing for the `?variant=` search
 * explorations on `/`. Client-side only, no server calls, no persistence.
 */

export interface Place {
  id: number
  slug: string
  title: string
  description?: string | null
  rating?: number | null
  review_count?: number | null
  city?: string | null
  tags: string[]
  price_level?: string | null
  latitude?: number | null
  longitude?: number | null
  isOpen: boolean
}

export const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

export function priceLabel(level?: string | null) {
  return level ? (PRICE_LABELS[level] ?? null) : null
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
}

export function tokenize(query: string) {
  return normalize(query).split(/\s+/).filter(Boolean)
}

/** Field weights: a title hit beats a city hit beats a blurb hit. */
const FIELDS: { get: (place: Place) => string, weight: number }[] = [
  { get: place => place.title, weight: 10 },
  { get: place => place.city ?? '', weight: 6 },
  { get: place => place.tags.join(' '), weight: 5 },
  { get: place => place.description ?? '', weight: 2 },
]

function scoreToken(haystack: string, token: string, weight: number) {
  const index = haystack.indexOf(token)
  if (index === -1)
    return 0
  const wordStart = index === 0 || /\W/.test(haystack[index - 1]!)
  return weight * (index === 0 ? 3 : wordStart ? 2 : 1)
}

export function scorePlace(place: Place, tokens: string[]) {
  if (tokens.length === 0)
    return 0
  let total = 0
  for (const token of tokens) {
    let best = 0
    for (const field of FIELDS)
      best = Math.max(best, scoreToken(normalize(field.get(place)), token, field.weight))
    // every token must land somewhere — AND semantics, like Algolia's default
    if (best === 0)
      return 0
    total += best
  }
  // popularity nudge so ties break toward well-reviewed places
  return total + Math.min((place.rating ?? 0) / 10, 0.5)
}

export function searchPlaces(places: Place[], query: string) {
  const tokens = tokenize(query)
  if (tokens.length === 0)
    return places
  return places
    .map(place => ({ place, score: scorePlace(place, tokens) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.place.title.localeCompare(b.place.title))
    .map(entry => entry.place)
}

/** Split text into runs so matched substrings can be wrapped in <mark>. */
export function highlight(text: string, query: string) {
  const tokens = tokenize(query)
  if (!text || tokens.length === 0)
    return [{ text, hit: false }]

  const haystack = normalize(text)
  const hits = Array.from({ length: text.length }).fill(false)
  for (const token of tokens) {
    let from = 0
    while (from <= haystack.length - token.length) {
      const index = haystack.indexOf(token, from)
      if (index === -1)
        break
      for (let i = index; i < index + token.length; i++) hits[i] = true
      from = index + token.length
    }
  }

  const runs: { text: string, hit: boolean }[] = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || hits[i] !== hits[start]) {
      runs.push({ text: text.slice(start, i), hit: Boolean(hits[start]) })
      start = i
    }
  }
  return runs
}

export interface Facet { value: string, count: number }

function tally(values: (string | null | undefined)[]): Facet[] {
  const counts = new Map<string, number>()
  for (const value of values) {
    if (!value)
      continue
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
}

export function buildFacets(places: Place[]) {
  return {
    towns: tally(places.map(place => place.city)),
    tags: tally(places.flatMap(place => place.tags)),
    prices: tally(places.map(place => priceLabel(place.price_level))),
  }
}

export interface Refinements {
  towns: string[]
  tags: string[]
  prices: string[]
  openNow: boolean
}

export const NO_REFINEMENTS: Refinements = { towns: [], tags: [], prices: [], openNow: false }

export function refine(places: Place[], refinements: Refinements) {
  return places.filter((place) => {
    if (refinements.openNow && !place.isOpen)
      return false
    if (refinements.towns.length && !refinements.towns.includes(place.city ?? ''))
      return false
    if (refinements.prices.length && !refinements.prices.includes(priceLabel(place.price_level) ?? ''))
      return false
    if (refinements.tags.length && !refinements.tags.some(tag => place.tags.includes(tag)))
      return false
    return true
  })
}

export function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}
