import { createServerFn } from '@tanstack/react-start'

import type { Facet, PlaceDoc, SearchIndex } from './search'

import { getSearchIndexData } from '../db/queries/restaurants'
import { compileCuisineMatchers, deriveCuisineSlugs } from './cuisine'
import { getIsOpen } from './is-open'
import { priceLabel, slugifyTown } from './search'

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value)
    return fallback
  try {
    return JSON.parse(value) as T
  }
  catch {
    return fallback
  }
}

function tally(entries: { slug: string, name: string }[]) {
  const counts = new Map<string, Facet>()
  for (const entry of entries) {
    const existing = counts.get(entry.slug)
    if (existing)
      existing.count += 1
    else
      counts.set(entry.slug, { ...entry, count: 1 })
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/**
 * Shapes the whole searchable set into one small payload: the palette fetches it
 * once on first open and ranks locally from then on.
 */
export const getSearchIndex = createServerFn({ method: 'GET' }).handler(async (): Promise<SearchIndex> => {
  const { restaurants, categories } = await getSearchIndexData()
  const matchers = compileCuisineMatchers(categories)
  const cuisineNames = new Map(matchers.map(matcher => [matcher.slug, matcher.name]))

  const townEntries: { slug: string, name: string }[] = []
  const cuisineEntries: { slug: string, name: string }[] = []

  const places: PlaceDoc[] = restaurants.map((restaurant) => {
    const tags = parseJson<string[]>(restaurant.tags, [])
    const cuisineSlugs = deriveCuisineSlugs({
      title: restaurant.title,
      blurb: [restaurant.description ?? '', tags.join(' ')].join(' '),
    }, matchers)

    if (restaurant.city)
      townEntries.push({ slug: slugifyTown(restaurant.city), name: restaurant.city })
    for (const slug of cuisineSlugs)
      cuisineEntries.push({ slug, name: cuisineNames.get(slug) ?? slug })

    return {
      id: restaurant.id,
      slug: restaurant.slug,
      title: restaurant.title,
      city: restaurant.city,
      cuisines: cuisineSlugs.map(slug => cuisineNames.get(slug) ?? slug),
      priceLabel: priceLabel(restaurant.price_level),
      rating: restaurant.rating,
      isOpen: getIsOpen(parseJson<{ day: number, open: string, close: string }[] | null>(restaurant.opening_hours, null)),
    }
  })

  return { places, towns: tally(townEntries), cuisines: tally(cuisineEntries) }
})
