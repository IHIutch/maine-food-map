import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { lazy, Suspense, useState } from 'react'
import * as z from 'zod'

import type { PlaceFilters } from '../utils/place-filters'

import PlaceCard from '../components/place-card'
import PlaceFiltersControl from '../components/place-filters'
import { button } from '../components/ui'
import { getCategories, getRestaurantList } from '../db/queries/restaurants'
import { compileCuisineMatchers, deriveCuisineSlugs } from '../utils/cuisine'
import { getIsOpen } from '../utils/is-open'
import { applyPlaceFilters, buildPlaceFacets, NO_FILTERS, parseFilterList, serializeFilterList } from '../utils/place-filters'
import { slugifyTown } from '../utils/search'

const MapboxEmbed = lazy(() => import('../components/mapbox-embed'))

// Server function to fetch restaurants
export const getRestaurants = createServerFn({ method: 'GET' }).handler(async () => {
  const [restaurants, categories] = await Promise.all([getRestaurantList(), getCategories()])
  const matchers = compileCuisineMatchers(categories)
  const cuisineNames = new Map(matchers.map(matcher => [matcher.slug, matcher.name]))

  return {
    restaurants: restaurants.map((restaurant) => {
      const opening_hours = restaurant.opening_hours
        ? JSON.parse(restaurant.opening_hours)
        : null

      const tags: string[] = restaurant.tags ? JSON.parse(restaurant.tags) : []
      const cuisineSlugs = deriveCuisineSlugs({
        title: restaurant.title,
        blurb: [restaurant.description ?? '', tags.join(' ')].join(' '),
      }, matchers)

      return {
        ...restaurant,
        tags,
        opening_hours,
        isOpen: getIsOpen(opening_hours),
        townSlug: restaurant.city ? slugifyTown(restaurant.city) : null,
        cuisineSlugs,
      }
    }),
    cuisineNames: Object.fromEntries(cuisineNames),
  }
})

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    view: z.enum(['list', 'map']).default('list'),
    city: z.string().default(''),
    cuisine: z.string().default(''),
    price: z.string().default(''),
    openNow: z.boolean().default(false),
  }),
  search: {
    middlewares: [stripSearchParams({ view: 'list', city: '', cuisine: '', price: '', openNow: false })],
  },
  loader: async () => await getRestaurants(),
  component: PlacesIndex,
  shouldReload: match => match.cause !== 'stay',
})

function PlacesIndex() {
  const { restaurants, cuisineNames } = Route.useLoaderData()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const { view, city, cuisine, price, openNow } = Route.useSearch()
  const navigate = Route.useNavigate()

  const filters = {
    city: parseFilterList(city),
    cuisine: parseFilterList(cuisine),
    price: parseFilterList(price),
    openNow,
  }
  const facets = buildPlaceFacets(restaurants, filters, cuisineNames)
  const filtered = applyPlaceFilters(restaurants, filters)

  function setFilters(next: PlaceFilters) {
    navigate({
      search: previous => ({
        ...previous,
        city: serializeFilterList(next.city),
        cuisine: serializeFilterList(next.cuisine),
        price: serializeFilterList(next.price),
        openNow: next.openNow,
      }),
      replace: true,
    })
  }

  return (
    <div>
      <PlaceFiltersControl
        places={restaurants}
        facets={facets}
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
        cuisineNames={cuisineNames}
        view={view}
        onViewChange={next => navigate({ search: previous => ({ ...previous, view: next }), replace: true })}
      />

      <div className="flex flex-col-reverse lg:flex-row lg:items-start">
        {/* On a phone the two views take turns; from lg they sit side by side. */}
        <div className={`flex-col p-6 lg:flex lg:min-w-0 lg:flex-1 ${view === 'map' ? 'hidden' : 'flex'}`}>

          <div>
            <h1 className="mt-2 font-pretrona text-5xl font-semibold tracking-tight">Places to eat in Maine</h1>
            <p className="mt-1 font-instrument text-lg text-stone-500">Hand-kept and unsponsored. Drive times are from Portland; hours confirmed within the last week.</p>

          </div>

          {filtered.length > 0
            ? (
                <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8">
                  {filtered.map(restaurant => (
                    <PlaceCard
                      key={restaurant.id}
                      restaurant={restaurant}
                    />
                  ))}
                </ul>
              )
            : (
                <div className="mt-16 text-center">
                  <p className="font-display text-2xl font-medium text-ink">No places match those filters</p>
                  <p className="mt-2 font-sans text-stone-500">Try dropping one — “open now” is the usual culprit outside serving hours.</p>
                  <button
                    type="button"
                    onClick={() => setFilters(NO_FILTERS)}
                    className={button({ scheme: 'outline', className: 'mt-6' })}
                  >
                    Clear all filters
                  </button>
                </div>
              )}
        </div>

        <div className={`h-[calc(100dvh-8rem)] min-h-0 lg:sticky lg:top-30 lg:block lg:h-[calc(100dvh-120px)] lg:min-w-0 lg:flex-1 ${view === 'map' ? 'block' : 'hidden'}`}>
          <div className="flex h-full flex-col">
            <Suspense
              fallback={(
                <div className="flex h-full items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="mx-auto mb-4 size-12 animate-spin rounded-full border-b-2 border-blueberry-500" />
                    <p className="text-stone-500">Loading map...</p>
                  </div>
                </div>
              )}
            >
              <MapboxEmbed
                places={filtered}
                selectedId={selectedRestaurant}
                onMarkerClick={(id: number) => setSelectedRestaurant(id)}
                isShowing={view === 'map'}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
