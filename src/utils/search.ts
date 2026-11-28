/**
 * The command palette fetches the search index once and uses Fuse to rank it
 * locally. Query aliases expand terms such as "bbq" to Barbeque. Fuse match
 * ranges identify the text to highlight in results.
 */
import type { FuseResultMatch } from 'fuse.js'

import Fuse from 'fuse.js'

import { aliasSlugsFor } from './cuisine-aliases'

export interface PlaceDoc {
  id: number
  slug: string
  title: string
  city: string | null
  cuisines: string[]
  priceLabel: string | null
  rating: number | null
  isOpen: boolean
}

export interface Facet {
  slug: string
  name: string
  count: number
}

export interface SearchIndex {
  places: PlaceDoc[]
  towns: Facet[]
  cuisines: Facet[]
}

export type Range = readonly [number, number]

export interface PlaceHit {
  place: PlaceDoc
  title: Range[]
  city: Range[]
}

export interface FacetHit {
  facet: Facet
  name: Range[]
}

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

export function priceLabel(level?: string | null) {
  return level ? (PRICE_LABELS[level] ?? null) : null
}

export function slugifyTown(city: string) {
  return city.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Tolerant enough for a typo or a missing letter, tight enough to stay relevant. */
const FUZZINESS = {
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
  includeMatches: true,
  includeScore: true,
} as const

export function createPlaceSearcher(places: PlaceDoc[]) {
  return new Fuse(places, {
    ...FUZZINESS,
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'city', weight: 0.25 },
      { name: 'cuisines', weight: 0.15 },
    ],
  })
}

export function createFacetSearcher(facets: Facet[]) {
  return new Fuse(facets, { ...FUZZINESS, keys: [{ name: 'name', weight: 1 }] })
}

type PlaceSearcher = ReturnType<typeof createPlaceSearcher>
type FacetSearcher = ReturnType<typeof createFacetSearcher>

function rangesFor(matches: readonly FuseResultMatch[] | undefined, key: string): Range[] {
  return matches?.filter(match => match.key === key).flatMap(match => match.indices as unknown as Range[]) ?? []
}

/** Expand query shorthand to cuisine names, such as "kbbq" to Korean. */
export function aliasCuisines(query: string, cuisines: Facet[]) {
  const matches = aliasSlugsFor(query)
  if (matches.length === 0)
    return []
  return matches
    .flatMap(({ slug, exact }) => {
      const cuisine = cuisines.find(candidate => candidate.slug === slug)
      return cuisine ? [{ ...cuisine, exact }] : []
    })
    .sort((a, b) => Number(b.exact) - Number(a.exact) || b.count - a.count)
}

export function searchPlaces(
  searcher: PlaceSearcher,
  places: PlaceDoc[],
  query: string,
  limit: number,
  aliases: { name: string, exact: boolean }[] = [],
): PlaceHit[] {
  if (query.trim().length === 0) {
    return [...places]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, limit)
      .map(place => ({ place, title: [], city: [] }))
  }

  const best = new Map<number, { hit: PlaceHit, score: number }>()
  const consider = (result: { item: PlaceDoc, score?: number, matches?: readonly FuseResultMatch[] }, penalty: number) => {
    const score = (result.score ?? 1) + penalty
    const existing = best.get(result.item.id)
    if (existing && existing.score <= score)
      return
    best.set(result.item.id, {
      score,
      hit: {
        place: result.item,
        title: rangesFor(result.matches, 'title'),
        city: rangesFor(result.matches, 'city'),
      },
    })
  }

  for (const result of searcher.search(query))
    consider(result, 0)

  // Typing "pho" outright should beat an incidental match inside "Photography",
  // but a partial overlap stays a weak hint.
  for (const alias of aliases) {
    for (const result of searcher.search(alias.name))
      consider(result, alias.exact ? 0.05 : 0.3)
  }

  return [...best.values()]
    .sort((a, b) => a.score - b.score || (b.hit.place.rating ?? 0) - (a.hit.place.rating ?? 0))
    .slice(0, limit)
    .map(entry => entry.hit)
}

export function searchFacets(searcher: FacetSearcher, query: string, limit: number, pinned: Facet[] = []): FacetHit[] {
  if (query.trim().length === 0)
    return []

  const hits: FacetHit[] = pinned.map(facet => ({ facet, name: [] }))
  const seen = new Set(pinned.map(facet => facet.slug))

  for (const result of searcher.search(query)) {
    if (seen.has(result.item.slug))
      continue
    seen.add(result.item.slug)
    hits.push({ facet: result.item, name: rangesFor(result.matches, 'name') })
  }

  return hits.slice(0, limit)
}

/** Split text into runs so matched substrings can be wrapped in <mark>. */
export function highlight(text: string, ranges: Range[]) {
  if (!text || ranges.length === 0)
    return [{ text, hit: false }]

  const hits = Array.from({ length: text.length }).fill(false)
  for (const [start, end] of ranges) {
    for (let i = start; i <= end && i < text.length; i++)
      hits[i] = true
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
