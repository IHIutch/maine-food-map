/**
 * Filter maths for the places index. Filters live in the URL, so this module is
 * pure: it turns a set of places plus the active filters into results and facet
 * counts, and nothing else.
 */

export interface FilterablePlace {
  city?: string | null
  townSlug: string | null
  cuisineSlugs: string[]
  price_level?: string | null
  isOpen: boolean
}

export interface PlaceFilters {
  city: string[]
  cuisine: string[]
  price: string[]
  openNow: boolean
}

export const NO_FILTERS: PlaceFilters = { city: [], cuisine: [], price: [], openNow: false }

/**
 * Filters travel in the URL as comma-separated slugs — `?cuisine=seafood,thai`
 * rather than a JSON blob — so a filtered view is legible when it's shared.
 */
export function parseFilterList(value: string | undefined) {
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : []
}

export function serializeFilterList(list: string[]) {
  return list.join(',')
}

const PRICE_LABELS: Record<string, string> = {
  PRICE_LEVEL_INEXPENSIVE: '$',
  PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$',
  PRICE_LEVEL_VERY_EXPENSIVE: '$$$$',
}

export function priceOf(place: FilterablePlace) {
  return place.price_level ? (PRICE_LABELS[place.price_level] ?? null) : null
}

export function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value]
}

export function activeFilterCount(filters: PlaceFilters) {
  return filters.city.length + filters.cuisine.length + filters.price.length + (filters.openNow ? 1 : 0)
}

type Dimension = keyof PlaceFilters

/** Every dimension except one — how a facet counts what picking it would leave. */
function applyExcept<T extends FilterablePlace>(places: T[], filters: PlaceFilters, except?: Dimension) {
  return places.filter((place) => {
    if (except !== 'openNow' && filters.openNow && !place.isOpen)
      return false
    if (except !== 'city' && filters.city.length && !filters.city.includes(place.townSlug ?? ''))
      return false
    if (except !== 'cuisine' && filters.cuisine.length && !place.cuisineSlugs.some(slug => filters.cuisine.includes(slug)))
      return false
    if (except !== 'price' && filters.price.length && !filters.price.includes(priceOf(place) ?? ''))
      return false
    return true
  })
}

export function applyPlaceFilters<T extends FilterablePlace>(places: T[], filters: PlaceFilters) {
  return applyExcept(places, filters)
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

function tally(entries: { value: string, label: string }[]): FacetOption[] {
  const counts = new Map<string, FacetOption>()
  for (const entry of entries) {
    const existing = counts.get(entry.value)
    if (existing)
      existing.count += 1
    else
      counts.set(entry.value, { ...entry, count: 1 })
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function buildPlaceFacets<T extends FilterablePlace>(
  places: T[],
  filters: PlaceFilters,
  cuisineNames: Record<string, string>,
) {
  return {
    city: tally(applyExcept(places, filters, 'city')
      .flatMap(place => (place.townSlug ? [{ value: place.townSlug, label: place.city ?? place.townSlug }] : []))),
    cuisine: tally(applyExcept(places, filters, 'cuisine')
      .flatMap(place => place.cuisineSlugs.map(slug => ({ value: slug, label: cuisineNames[slug] ?? slug })))),
    price: tally(applyExcept(places, filters, 'price')
      .flatMap((place) => {
        const label = priceOf(place)
        return label ? [{ value: label, label }] : []
      }))
      .sort((a, b) => a.label.length - b.label.length),
    openNow: applyExcept(places, filters, 'openNow').filter(place => place.isOpen).length,
  }
}

export type PlaceFacets = ReturnType<typeof buildPlaceFacets>
