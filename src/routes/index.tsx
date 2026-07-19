import { createFileRoute, Link, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { computeIsOpen } from '../utils/opening-hours'
import { useState, lazy, Suspense } from 'react'
import * as z from 'zod'

const MapboxEmbed = lazy(() => import('../components/mapbox-embed'))

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
    <div className="fixed pt-16 inset-0 bg-gray-50 flex flex-col z-0">
      {/* Mobile Toggle */}
      <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Discover {restaurants.length} restaurants</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                navigate({
                  to: "/",
                  search: (old) => ({ ...old, view: 'list' }),
                  replace: false,
                });
              }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
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
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'map'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              Map View
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 h-full">
        {/* List View - Hidden on mobile when map is showing */}
        <div className={`${view === 'map' ? 'hidden' : 'block'} lg:block lg:w-1/2 w-full overflow-y-auto h-full`}>
          <div className='hidden lg:block sticky top-0 bg-gray-50 py-2 px-4 border-b border-gray-300'>
            <span>Discover {restaurants.length} amazing restaurants in Maine</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            {restaurants.map((restaurant) => {
              const isSelected = selectedRestaurant === restaurant.id
              return (
                <Link
                  key={restaurant.id}
                  to="/places/$slug"
                  params={{ slug: restaurant.slug }}
                  className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 block ${isSelected ? 'ring-2 ring-blue-500' : ''
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold">{restaurant.title}</h2>
                    {restaurant.rating && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="font-medium">{restaurant.rating}</span>
                        <span className="text-yellow-500">⭐</span>
                      </div>
                    )}
                  </div>

                  {restaurant.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {restaurant.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    {restaurant.city && <span>{restaurant.city}</span>}
                    {restaurant.review_count && (
                      <>
                        <span>•</span>
                        <span>{restaurant.review_count} reviews</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {restaurant.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {restaurant.tags.length > 2 && (
                        <span className="px-2 py-1 text-gray-500 text-xs">
                          +{restaurant.tags.length - 2}
                        </span>
                      )}
                    </div>

                    <span className={`text-xs font-medium ${restaurant.isOpen ? 'text-green-600' : 'text-red-600'
                      }`}>
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
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
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