import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { lazy, Suspense, useState } from 'react'
import * as z from 'zod'

// PROTOTYPE — search variants (`?variant=`). Remove with the switcher once one wins.
import type { Place } from '../components/prototype-search/search-core'

import PlaceCard from '../components/place-card'
import VariantCommandPalette from '../components/prototype-search/variant-command-palette'
import VariantFacetedSidebar from '../components/prototype-search/variant-faceted-sidebar'
import VariantHeroTokens from '../components/prototype-search/variant-hero-tokens'
import VariantMapFirst from '../components/prototype-search/variant-map-first'
import { PrototypeSwitcher } from '../components/prototype-switcher'
import { button } from '../components/ui'
import { prismaGetRestaurants } from '../utils/prisma/restaurants'

const SEARCH_VARIANTS = ['off', 'A', 'B', 'C', 'D'] as const
type SearchVariant = (typeof SEARCH_VARIANTS)[number]
const SEARCH_VARIANT_NAMES: Record<SearchVariant, string> = {
  off: 'Current page (no search)',
  A: 'Command palette (⌘K)',
  B: 'Faceted sidebar',
  C: 'Hero token search',
  D: 'Map-first search',
}

const MapboxEmbed = lazy(() => import('../components/mapbox-embed'))

// Server function to fetch restaurants
export const getRestaurants = createServerFn({ method: 'GET' }).handler(async () => {
  const restaurants = await prismaGetRestaurants()
  // Parse JSON fields and check if open
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return {
    restaurants: restaurants.map((restaurant) => {
      const opening_hours = restaurant.opening_hours
        ? JSON.parse(restaurant.opening_hours)
        : null

      let isOpen = false
      if (opening_hours) {
        const todaySchedule = opening_hours[currentDay]
        if (
          todaySchedule
          && !(todaySchedule.open === '00:00' && todaySchedule.close === '00:00')
        ) {
          isOpen
            = currentTime >= todaySchedule.open
              && currentTime <= todaySchedule.close
        }
      }

      return {
        ...restaurant,
        tags: restaurant.tags ? JSON.parse(restaurant.tags) : [],
        opening_hours,
        isOpen,
      }
    }),
  }
})

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    view: z.enum(['list', 'map']).default('list'),
    variant: z.enum(SEARCH_VARIANTS).default('off'),
  }),
  search: {
    middlewares: [stripSearchParams({ view: 'list', variant: 'off' })],
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
  const { view, variant } = Route.useSearch()
  const navigate = Route.useNavigate()
  const filtered = restaurants.filter((restaurant) => {
    if (town !== 'all' && restaurant.city !== town)
      return false
    if (openNow && !restaurant.isOpen)
      return false
    return true
  })

  const switcher = (
    <PrototypeSwitcher
      variants={SEARCH_VARIANTS}
      current={variant}
      names={SEARCH_VARIANT_NAMES}
      onChange={next => navigate({ search: previous => ({ ...previous, variant: next }), replace: true })}
    />
  )

  if (variant !== 'off') {
    const places = filtered as unknown as Place[]
    return (
      <>
        {variant === 'A' && <VariantCommandPalette places={places} />}
        {variant === 'B' && <VariantFacetedSidebar places={places} />}
        {variant === 'C' && <VariantHeroTokens places={places} />}
        {variant === 'D' && <VariantMapFirst places={places} />}
        {switcher}
      </>
    )
  }

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
      {switcher}
    </div>
  )
}
