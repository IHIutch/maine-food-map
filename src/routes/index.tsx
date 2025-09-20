import { createFileRoute, Link, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { useState, memo, useRef, lazy, Suspense } from 'react'
import * as z from 'zod'
import { useVirtualizer } from '@tanstack/react-virtual'

const MapboxEmbed = lazy(() => import('../components/mapbox-embed'))

// Server function to fetch restaurants
const getRestaurants = createServerFn({ method: 'GET' }).handler(async () => {
  const restaurants = await prisma.restaurants.findMany({
    where: {
      // Only show restaurants with external data
      rating: { not: null },
      state: { equals: 'ME' }
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
    // No limit - show all restaurants with virtual scrolling
  })

  // Parse JSON fields and check if open
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return restaurants.map(restaurant => {
    const opening_hours = restaurant.opening_hours ? JSON.parse(restaurant.opening_hours) : null

    // Check if currently open
    let isOpen = false
    if (opening_hours) {
      const todaySchedule = opening_hours[currentDay]
      if (todaySchedule && !(todaySchedule.open === "00:00" && todaySchedule.close === "00:00")) {
        isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
      }
    }

    return {
      ...restaurant,
      tags: restaurant.tags ? JSON.parse(restaurant.tags) : [],
      opening_hours,
      isOpen
    }
  })
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

// Memoized restaurant card component for better performance
const RestaurantCard = memo(({ restaurant, isSelected }: {
  restaurant: any,
  isSelected: boolean
}) => (
  <Link
    to="/places/$slug"
    params={{ slug: restaurant.slug }}
    data-restaurant-card
    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 h-full flex flex-col ${isSelected ? 'ring-2 ring-blue-500' : ''
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

    <div className="flex items-center justify-between mt-auto">
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
))

function PlacesIndex() {
  const restaurants = Route.useLoaderData()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const { view } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })
  const parentRef = useRef<HTMLDivElement>(null)

  const restaurantsWithCoords = restaurants.filter(r => r.latitude && r.longitude)

  // Grid virtualization - rows with equal heights  
  const COLUMNS = 2
  const rowCount = Math.ceil(restaurants.length / COLUMNS)

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250,
    overscan: 3,
    gap: 16,
    measureElement: (element) => {
      if (!element) return 250
      return element.getBoundingClientRect().height
    },
  })

  return (
    <div className="fixed pt-16 inset-0 bg-gray-50 flex flex-col z-0">
      {/* Mobile Toggle */}
      <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-300 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Discover {restaurants.length} restaurants</span>
          <div className="flex gap-1">
            <button
              onClick={() => navigate({
                to: "/",
                search: (old) => ({ ...old, view: 'list' }),
                replace: true,
              })}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${view === 'list'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              List View
            </button>
            <button
              onClick={() =>
                navigate({
                  to: "/",
                  search: (old) => ({ ...old, view: 'map' }),
                  replace: true,
                })
              }
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
        {/* List View - Virtual scrolling for performance */}
        <div className={`${view === 'map' ? 'hidden' : 'block'} lg:block lg:w-1/2 w-full h-full`}>
          <div className='hidden lg:block sticky top-0 bg-gray-50 py-2 px-4 border-b border-gray-300 z-10'>
            <span>Discover {restaurants.length} amazing restaurants in Maine</span>
          </div>
          <div
            ref={parentRef}
            className="h-full overflow-auto pt-4"
          >
            <div
              className="w-full relative"
              style={{
                height: `${virtualizer.getTotalSize()}px`,
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * COLUMNS
                const rowRestaurants = restaurants.slice(startIndex, startIndex + COLUMNS)

                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    className="absolute top-0 w-full"
                    style={{
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="grid grid-cols-2 gap-4 px-4 min-h-full">
                      {rowRestaurants.map((restaurant) => (
                        <div key={restaurant.id} className="h-full">
                          <RestaurantCard
                            restaurant={restaurant}
                            isSelected={selectedRestaurant === restaurant.id}
                          />
                        </div>
                      ))}
                      {/* Fill empty slots if odd number of restaurants */}
                      {rowRestaurants.length === 1 && (
                        <div className="h-full" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
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
              places={restaurantsWithCoords}
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