import { createFileRoute, Link } from '@tanstack/react-router'
import { prisma } from '../utils/prisma'

export const Route = createFileRoute('/')({
  loader: async () => {
    const restaurants = await prisma.restaurants.findMany({
      where: {
        // Only show restaurants with external data
        rating: { not: null }
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
        opening_hours: true
      },
      orderBy: [
        { rating: 'desc' },
        { title: 'asc' }
      ],
      cacheStrategy: {
        ttl: 3600 // one hour
      },
    })

    // Parse JSON fields
    return restaurants.map(restaurant => ({
      ...restaurant,
      tags: restaurant.tags ? JSON.parse(restaurant.tags) : [],
      opening_hours: restaurant.opening_hours ? JSON.parse(restaurant.opening_hours) : null
    }))
  },
  component: PlacesIndex
})

function PlacesIndex() {
  const restaurants = Route.useLoaderData()

  // Helper to check if a restaurant is currently open
  const isOpenNow = (openingHours: any) => {
    if (!openingHours) return false

    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const todaySchedule = openingHours[currentDay]

    if (todaySchedule.open === "00:00" && todaySchedule.close === "00:00") {
      return false
    }

    return currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8">Maine Food Map</h1>

        <div className="mb-6">
          <p className="text-gray-600">
            Discover {restaurants.length} amazing restaurants in Maine
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => {
            const open = isOpenNow(restaurant.opening_hours)

            return (
              <Link
                key={restaurant.id}
                to="/places/$slug"
                params={{ slug: restaurant.slug }}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 block"
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

                  <span className={`text-xs font-medium ${open ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {open ? 'Open' : 'Closed'}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}