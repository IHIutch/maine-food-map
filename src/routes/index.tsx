import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { lazy, Suspense, useState } from 'react'
import * as z from 'zod'

import PlaceCard from '../components/place-card'
import { button } from '../components/ui'
import { getRestaurantList } from '../db/queries/restaurants'
import { getIsOpen } from '../utils/is-open'

const MapboxEmbed = lazy(() => import('../components/mapbox-embed'))

// Server function to fetch restaurants
export const getRestaurants = createServerFn({ method: 'GET' }).handler(async () => {
  const restaurants = await getRestaurantList()

  return {
    restaurants: restaurants.map((restaurant) => {
      const opening_hours = restaurant.opening_hours
        ? JSON.parse(restaurant.opening_hours)
        : null

      return {
        ...restaurant,
        tags: restaurant.tags ? JSON.parse(restaurant.tags) : [],
        opening_hours,
        isOpen: getIsOpen(opening_hours),
      }
    }),
  }
})

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    view: z.enum(['list', 'map']).default('list'),
  }),
  search: {
    middlewares: [stripSearchParams({ view: 'list' })],
  },
  loader: async () => await getRestaurants(),
  component: PlacesIndex,
  shouldReload: match => match.cause !== 'stay',
})

function PlacesIndex() {
  const { restaurants } = Route.useLoaderData()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const [town] = useState('all')
  const [openNow] = useState(false)
  const { view } = Route.useSearch()
  const filtered = restaurants.filter((restaurant) => {
    if (town !== 'all' && restaurant.city !== town)
      return false
    if (openNow && !restaurant.isOpen)
      return false
    return true
  })

  return (
    <div>
      <div className="sticky top-16 z-20 flex min-h-14 items-center gap-2 border-b border-stone-200 bg-white px-4 sm:px-6">
        {/* Filter location */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="font-normal text-stone-300">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="font-medium text-black">Seafood</span>
            <span className="font-normal text-stone-500">4</span>
          </button>
        </div>
        {/* Filter type: cafe, pub, restaurant */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="font-normal text-stone-300">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="font-medium text-black">Seafood</span>
            <span className="font-normal text-stone-500">4</span>
          </button>
        </div>
        {/* Filter cuisine */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="font-normal text-stone-300">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="font-medium text-black">Seafood</span>
            <span className="font-normal text-stone-500">4</span>
          </button>
        </div>
        {/* Filter price */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="font-normal text-stone-300">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="font-medium text-black">Seafood</span>
            <span className="font-normal text-stone-500">4</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col-reverse lg:flex-row lg:items-start">
        <div className="flex flex-col p-6 lg:min-w-0 lg:flex-1">

          <div>
            <h1 className="mt-2 font-pretrona text-5xl font-semibold tracking-tight">Places to eat in Maine</h1>
            <p className="mt-1 font-instrument text-lg text-stone-500">Hand-kept and unsponsored. Drive times are from Portland; hours confirmed within the last week.</p>
          </div>

          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8">
            {filtered.map(restaurant => (
              <PlaceCard
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </ul>
        </div>

        <div className="h-[calc(100dvh-120px)] min-h-0 lg:sticky lg:top-30 lg:min-w-0 lg:flex-1">
          <div className="flex h-full flex-col">
            <Suspense
              fallback={(
                <div className="flex h-full items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
                    <p className="text-ink-soft">Loading map...</p>
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
