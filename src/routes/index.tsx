import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { useState } from 'react'
import MapboxEmbed from '../components/mapbox-embed'

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
    // take: 10
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
  loader: async () => {
    return await getRestaurants()
  },
  component: PlacesIndex
})

function PlacesIndex() {
  const restaurants = Route.useLoaderData()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)

  const restaurantsWithCoords = restaurants.filter(r => r.latitude && r.longitude)

  return (
    <div className="fixed pt-16 inset-0 bg-gray-50 flex flex-col z-0">
      <div className="flex flex-1 h-full">
        <div className="w-1/2 overflow-y-auto h-full">
          <div className='sticky top-0 bg-gray-50 py-2 px-4 border-b border-gray-300'>
            <span>Discover {restaurants.length} amazing restaurants in Maine</span>
          </div>
          <div className="grid grid-cols-2 gap-4 p-4">
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

        <div className="w-1/2 h-full sticky top-0">
          <MapboxEmbed
            places={restaurantsWithCoords}
            selectedId={selectedRestaurant}
            onMarkerClick={(id: number) => setSelectedRestaurant(id)}
          />
        </div>
      </div>
    </div>
  )
}