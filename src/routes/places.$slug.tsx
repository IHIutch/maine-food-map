import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { NotFound } from '../components/NotFound'
import { seo } from '../utils/seo'
import { trackEvent } from 'fathom-client'
import { baseUrl } from '../utils/base-url'

// Server function to fetch restaurant by slug
const getRestaurantBySlug = createServerFn({ method: 'GET' })
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { slug } = data
    const restaurant = await prisma.restaurants.findUnique({
      where: { slug },
      include: {
        restaurant_categories: {
          include: {
            categories: true
          }
        }
      },
      cacheStrategy: {
        ttl: 3600 // one hour
      },
    })

    if (!restaurant) {
      throw new Error('Restaurant not found')
    }

    // Parse JSON fields and check if open
    const opening_hours = restaurant.opening_hours ? JSON.parse(restaurant.opening_hours) : null

    // Calculate current status
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    let isOpen = false
    let todayHours = null

    if (opening_hours) {
      const todaySchedule = opening_hours[currentDay]
      if (todaySchedule) {
        if (todaySchedule.open === "00:00" && todaySchedule.close === "00:00") {
          todayHours = "Closed"
        } else {
          todayHours = `${todaySchedule.open} - ${todaySchedule.close}`
          isOpen = currentTime >= todaySchedule.open && currentTime <= todaySchedule.close
        }
      }
    }

    const parsedRestaurant = {
      ...restaurant,
      tags: restaurant.tags ? JSON.parse(restaurant.tags) : [],
      photos: restaurant.photos ? JSON.parse(restaurant.photos) : [],
      opening_hours,
      isOpen,
      todayHours
    }

    return parsedRestaurant
  })

export const Route = createFileRoute('/places/$slug')({
  loader: async ({ params }) => {
    return await getRestaurantBySlug({ data: { slug: params.slug } })
  },
  component: RestaurantPage,
  errorComponent: ({ error }) => {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Restaurant not found') {
      return <NotFound />
    }
    return <div>Error loading restaurant: {message}</div>
  },
  head: ({ loaderData }) => {
    // Create structured data for the restaurant
    const structuredData = loaderData ? {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": loaderData.title,
      "description": loaderData.description || "",
      "url": `${baseUrl}/places/${loaderData.slug}`,
      "address": loaderData.street_address ? {
        "@type": "PostalAddress",
        "streetAddress": loaderData.street_address,
        "addressLocality": loaderData.city,
        "addressRegion": loaderData.state,
        "postalCode": loaderData.postal_code,
        "addressCountry": "US"
      } : undefined,
      "telephone": loaderData.phone || undefined,
      "sameAs": loaderData.website || undefined,
      "aggregateRating": loaderData.rating ? {
        "@type": "AggregateRating",
        "ratingValue": loaderData.rating,
        "reviewCount": loaderData.review_count || 1,
        "bestRating": 5,
        "worstRating": 1
      } : undefined,
      "geo": (loaderData.latitude && loaderData.longitude) ? {
        "@type": "GeoCoordinates",
        "latitude": loaderData.latitude,
        "longitude": loaderData.longitude
      } : undefined,
      "openingHoursSpecification": loaderData.opening_hours ? loaderData.opening_hours.map((schedule: any) => {
        if (schedule.open === "00:00" && schedule.close === "00:00") {
          return null; // Skip closed days
        }
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": `https://schema.org/${dayNames[schedule.day]}`,
          "opens": schedule.open,
          "closes": schedule.close
        };
      }).filter(Boolean) : undefined,
      "servesCuisine": loaderData.restaurant_categories?.map((rc: any) => rc.categories.display_name) || undefined,
      "priceRange": loaderData.price_level ? "$".repeat(parseInt(loaderData.price_level)) : undefined,
      "image": loaderData.photos?.length > 0 ? loaderData.photos.map((photo: any) =>
        photo.url?.replace('YOUR_API_KEY', process.env.GOOGLE_PLACES_API_KEY || '')
      ) : undefined
    } : null;

    return {
      meta: [
        ...seo({
          title: `${loaderData?.title} | MaineFoodMap`,
          description: loaderData?.description || "",
        }),
      ],
      links: [{
        rel: 'canonical',
        href: `${baseUrl}/places/${loaderData?.slug}`,
      }],
      scripts: structuredData ? [{
        type: 'application/ld+json',
        children: JSON.stringify(structuredData)
      }] : []
    };
  },
})

function RestaurantPage() {
  const restaurant = Route.useLoaderData()

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{restaurant.title}</h1>

          {restaurant.description && (
            <p className="text-gray-600 mb-4">{restaurant.description}</p>
          )}

          {/* Status and Rating */}
          <div className="flex items-center gap-4 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${restaurant.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {restaurant.isOpen ? '🟢 Open Now' : '🔴 Closed'}
            </span>

            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <span className="text-lg font-medium">{restaurant.rating}</span>
                <span className="text-yellow-500">⭐</span>
                <span className="text-gray-500 text-sm">
                  ({restaurant.review_count} reviews)
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {restaurant.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {restaurant.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

              <div className="space-y-3">
                {restaurant.address && (
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{restaurant.street_address}</p>
                    <p className="text-gray-700">
                      {restaurant.city}, {restaurant.state} {restaurant.postal_code}
                    </p>
                  </div>
                )}

                {restaurant.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <a href={`tel:${restaurant.phone}`} className="text-blue-600 hover:underline">
                      {restaurant.phone}
                    </a>
                  </div>
                )}

                {restaurant.website && (
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <a
                      href={`${restaurant.website}?ref=${baseUrl}`}
                      onClick={() => {
                        trackEvent(`website_click: ${restaurant.slug}`);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Photos */}
            {restaurant.photos.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Photos</h2>
                <div className="grid grid-cols-2 gap-4">
                  {restaurant.photos.slice(0, 4).map((photo: any, index: number) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photo.url.replace('YOUR_API_KEY', process.env.GOOGLE_PLACES_API_KEY || '')}
                        alt={`${restaurant.title} photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Photo by {photo.attribution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Hours */}
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Hours</h2>

              {restaurant.opening_hours ? (
                <div className="space-y-2">
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="font-medium">{restaurant.todayHours || 'Hours not available'}</p>
                  </div>

                  {restaurant.opening_hours.map((schedule: any) => {
                    const isToday = schedule.day === new Date().getDay()
                    const isClosed = schedule.open === "00:00" && schedule.close === "00:00"

                    return (
                      <div
                        key={schedule.day}
                        className={`flex justify-between py-2 ${isToday ? 'font-medium' : ''}`}
                      >
                        <span>{dayNames[schedule.day]}</span>
                        <span className={isClosed ? 'text-gray-500' : ''}>
                          {isClosed ? 'Closed' : `${schedule.open} - ${schedule.close}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500">Hours not available</p>
              )}
            </div>

            {/* Categories */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">Categories</h2>
              <div className="space-y-2">
                {restaurant.restaurant_categories.map((rc: any) => (
                  <div key={rc.category_id} className="text-gray-700">
                    {rc.categories.display_name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
