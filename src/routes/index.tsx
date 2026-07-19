import { createFileRoute, Link, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { computeIsOpen } from '../utils/opening-hours'
import { baseUrl } from '../utils/base-url'
import { useState, lazy, Suspense } from 'react'
import * as z from 'zod'
import { chip, displayHeading, metaLabel, statusPill, togglePill } from '../components/ui'

const MapboxEmbed = lazy(() => import('../components/mapbox-embed'))

// Rotating pastel blocks, inspo-style (periwinkle/sage/butter/plum stat cards)
const CARD_TINTS = ['bg-sage-tint', 'bg-sky-tint', 'bg-butter-tint', 'bg-plum-tint']

// Server function to fetch restaurants
const getRestaurants = createServerFn({ method: 'GET' }).handler(async () => {
  const restaurants = await prisma.restaurants.findMany({
    where: {
      // Only show restaurants with external data
      rating: { not: null },
      state: { equals: 'ME' },
      longitude: { not: null },
      latitude: { not: null },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      rating: true,
      review_count: true,
      city: true,
      tags: true,
      opening_hours: true,
      latitude: true,
      longitude: true
    },
    orderBy: [
      { rating: 'desc' },
      { title: 'asc' }
    ],
    cacheStrategy: {
      ttl: 3600 // one hour
    },
  })

  return {
    restaurants: restaurants.map(({ opening_hours: rawHours, tags, ...rest }) => {
      const opening_hours = rawHours ? JSON.parse(rawHours) : null

      return {
        ...rest,
        tags: tags ? JSON.parse(tags) : [],
        isOpen: computeIsOpen(opening_hours)
      }
    })
  }
})

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    view: z.enum(['list', 'map']).default('list'),
  }),
  head: () => ({
    links: [{ rel: 'canonical', href: baseUrl + '/' }],
  }),
  search: {
    middlewares: [
      stripSearchParams({ view: 'list' })
    ],
  },
  loader: async () => {
    return await getRestaurants()
  },
  component: PlacesIndex,
  shouldReload: (match) => match.cause !== 'stay'
})

function PlacesIndex() {
  const { restaurants } = Route.useLoaderData()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const { view } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })

  return (
    <div className="fixed pt-16 inset-0 bg-paper flex flex-col z-0">
      {/* Mobile Toggle */}
      <div className="lg:hidden sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-ink/10 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className={metaLabel({ className: 'text-ink-soft' })}>
            {restaurants.length} restaurants
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => {
                navigate({
                  to: "/",
                  search: (old) => ({ ...old, view: 'list' }),
                  replace: false,
                });
              }}
              className={togglePill({ active: view === 'list' })}
            >
              List View
            </button>
            <button
              onClick={() => {
                navigate({
                  to: "/",
                  search: (old) => ({ ...old, view: 'map' }),
                });
              }}
              className={togglePill({ active: view === 'map' })}
            >
              Map View
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 h-full">
        {/* List View - Hidden on mobile when map is showing */}
        <div className={`${view === 'map' ? 'hidden' : 'block'} lg:block lg:w-1/2 w-full overflow-y-auto h-full`}>
          <div className='hidden lg:block py-10 px-6 border-b border-ink/10'>
            <p className={metaLabel({ className: 'text-ink-soft mb-2' })}>
              Maine Food Map
            </p>
            <h1 className={displayHeading({ className: 'text-4xl' })}>
              Discover {restaurants.length} great restaurants in Maine
            </h1>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5">
            {restaurants.map((restaurant, index) => {
              const isSelected = selectedRestaurant === restaurant.id
              const tint = CARD_TINTS[index % CARD_TINTS.length]
              return (
                <Link
                  key={restaurant.id}
                  to="/places/$slug"
                  params={{ slug: restaurant.slug }}
                  className={`${tint} rounded-2xl p-6 block hover:shadow-lg hover:-translate-y-0.5 transition ${isSelected ? 'ring-2 ring-pine' : ''
                    }`}
                >
                  {restaurant.city && (
                    <p className={metaLabel({ className: 'text-ink-soft mb-2' })}>
                      {restaurant.city}
                    </p>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className={displayHeading({ className: 'text-2xl' })}>
                      {restaurant.title}
                    </h2>
                    {restaurant.rating && (
                      <div className="flex items-baseline gap-1 flex-shrink-0">
                        <span className="font-display text-2xl font-semibold text-ink">
                          {restaurant.rating}
                        </span>
                        <span className="text-sm">⭐</span>
                      </div>
                    )}
                  </div>

                  {restaurant.description && (
                    <p className="text-ink-soft text-sm mb-4 line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}

                  <div className="flex items-end justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {restaurant.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className={chip({ tone: 'paper' })}>
                          {tag}
                        </span>
                      ))}
                      {restaurant.tags.length > 2 && (
                        <span className="text-ink-soft text-xs">
                          +{restaurant.tags.length - 2}
                        </span>
                      )}
                      {restaurant.review_count && (
                        <span className={metaLabel({ className: 'text-ink-soft ml-1' })}>
                          {restaurant.review_count} reviews
                        </span>
                      )}
                    </div>

                    <span className={statusPill({ open: restaurant.isOpen, solid: true })}>
                      {restaurant.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Map View - Hidden on mobile when list is showing */}
        <div className={`${view === 'list' ? 'hidden' : 'block'} lg:block lg:w-1/2 w-full h-full sticky top-0`}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-cream">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pine mx-auto mb-4"></div>
                <p className="text-ink-soft">Loading map...</p>
              </div>
            </div>
          }>
            <MapboxEmbed
              places={restaurants}
              selectedId={selectedRestaurant}
              onMarkerClick={(id: number) => setSelectedRestaurant(id)}
              isShowing={view === 'map'}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
