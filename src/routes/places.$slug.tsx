import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import * as React from 'react'
import { cn } from 'tailwind-variants'
import { z } from 'zod'

import { NotFound } from '../components/not-found'
import PlaceCard from '../components/place-card'
import { button } from '../components/ui'
import { findFirstBySlug, findNearest } from '../db/queries/restaurants'
import { baseUrl } from '../utils/env'
import { getIsOpen } from '../utils/is-open'
import { seo } from '../utils/seo'
import { restaurantSchema } from '../utils/zod/restaurant-schema'

const MapboxCloseup = React.lazy(() => import('../components/mapbox-closeup'))

// Server function to fetch restaurant by slug
const getRestaurantBySlug = createServerFn({ method: 'GET' })
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { slug } = data
    const restaurant = await findFirstBySlug({ slug })
    if (!restaurant) {
      throw new Error('Restaurant not found')
    }

    let nearby: Awaited<ReturnType<typeof findNearest>> = []
    if (restaurant.latitude && restaurant.longitude) {
      nearby = await findNearest({
        id: restaurant.id,
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      })
    }

    const parsedRestaurant = restaurantSchema.safeParse(restaurant)
    if (!parsedRestaurant.success) {
      throw new Error(z.prettifyError(parsedRestaurant.error))
    }

    const parsedNearby = restaurantSchema.array().safeParse(nearby)
    if (!parsedNearby.success) {
      throw new Error(z.prettifyError(parsedNearby.error))
    }

    // Calculate current status
    const now = new Date()
    const currentDay = now.getDay()

    let isOpen = false
    let todayHours = null

    const opening_hours = parsedRestaurant.data.opening_hours

    if (opening_hours) {
      const todaySchedule = opening_hours[currentDay]
      if (todaySchedule) {
        if (todaySchedule.open === '00:00' && todaySchedule.close === '00:00') {
          todayHours = 'Closed'
        }
        else {
          todayHours = `${todaySchedule.open} - ${todaySchedule.close}`
          isOpen = getIsOpen(opening_hours)
        }
      }
    }

    return {
      restaurant: {
        ...parsedRestaurant.data,
        isOpen,
        todayHours,
      },
      nearby: parsedNearby.data.map(place => ({
        ...place,
        isOpen: getIsOpen(place.opening_hours),
      })),
    }
  })

export const Route = createFileRoute('/places/$slug')({
  loader: async ({ params }) => {
    const data = await getRestaurantBySlug({ data: { slug: params.slug } })
    if (!data) {
      throw notFound()
    }
    return data
  },
  component: RestaurantPage,
  errorComponent: ({ error }) => {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Restaurant not found') {
      return <NotFound />
    }
    return (
      <div>
        Error loading restaurant:
        {message}
      </div>
    )
  },
  head: ({ loaderData }) => {
    const restaurant = loaderData?.restaurant
    // Create structured data for the restaurant
    const structuredData = loaderData
      ? {
          '@context': 'https://schema.org',
          '@type': 'Restaurant',
          'name': restaurant?.title,
          'description': restaurant?.description || '',
          'url': `${baseUrl}/places/${restaurant?.slug}`,
          'address': restaurant?.street_address
            ? {
                '@type': 'PostalAddress',
                'streetAddress': restaurant?.street_address,
                'addressLocality': restaurant?.city,
                'addressRegion': restaurant?.state,
                'postalCode': restaurant?.postal_code,
                'addressCountry': 'US',
              }
            : undefined,
          'telephone': restaurant?.phone || undefined,
          'sameAs': restaurant?.website || undefined,
          'aggregateRating': restaurant?.rating
            ? {
                '@type': 'AggregateRating',
                'ratingValue': restaurant?.rating,
                'reviewCount': restaurant?.review_count || 1,
                'bestRating': 5,
                'worstRating': 1,
              }
            : undefined,
          'geo': (restaurant?.latitude && restaurant?.longitude)
            ? {
                '@type': 'GeoCoordinates',
                'latitude': restaurant?.latitude,
                'longitude': restaurant?.longitude,
              }
            : undefined,
          'openingHoursSpecification': restaurant?.opening_hours
            ? restaurant?.opening_hours.map((schedule) => {
                if (schedule.open === '00:00' && schedule.close === '00:00') {
                  return null // Skip closed days
                }
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                return {
                  '@type': 'OpeningHoursSpecification',
                  'dayOfWeek': `https://schema.org/${dayNames[schedule.day]}`,
                  'opens': schedule.open,
                  'closes': schedule.close,
                }
              }).filter(Boolean)
            : undefined,
          'servesCuisine': restaurant?.restaurant_categories?.map(rc => rc.categories.display_name) || undefined,
          'priceRange': restaurant?.price_level ? '$'.repeat(parseInt(restaurant?.price_level)) : undefined,
          'image': (restaurant?.photos && restaurant?.photos.length > 0)
            ? restaurant?.photos.map(photo => photo.url)
            : undefined,
        }
      : null

    return {
      meta: [
        ...seo({
          title: `${restaurant?.title} | MaineFoodMap`,
          description: restaurant?.description || '',
        }),
      ],
      links: [{
        rel: 'canonical',
        href: `${baseUrl}/places/${restaurant?.slug}`,
      }],
      scripts: structuredData
        ? [{
            type: 'application/ld+json',
            children: JSON.stringify(structuredData),
          }]
        : [],
    }
  },
})

function RestaurantPage() {
  const { restaurant, nearby } = Route.useLoaderData()

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="py-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        {/* Header */}
        <div className="">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="font-pretrona text-5xl font-semibold tracking-tight">{restaurant?.title}</h1>
              <div className="mt-5 flex items-center gap-3">
                {/* Status */}
                {restaurant.isOpen
                  ? (
                      <div className="flex h-7 items-center gap-1.5 rounded-full bg-green-800/10 px-2.5">
                        <span className="size-2 rounded-full bg-green-800" />
                        <span className="text-xs font-medium text-green-800">Open</span>
                      </div>
                    )
                  : (
                      <div className="flex h-7 items-center gap-1.5 rounded-full bg-red-800/10 px-2.5">
                        <span className="size-2 rounded-full bg-red-800" />
                        <span className="text-xs font-medium text-red-800">Closed</span>
                      </div>
                    )}
                <div className="flex items-center gap-2">
                  {/* Tags */}
                  {(restaurant.tags && restaurant?.tags.length > 0)
                    ? restaurant.tags.map(tag => (
                        <div key={tag} className="flex h-7 items-center rounded-full border border-stone-300 px-2.5 text-xs font-medium">
                          {tag}
                        </div>
                      ))
                    : null}
                  {/* Price */}
                  {restaurant.price_level
                    ? (
                        <div className="flex h-7 items-center rounded-full border border-stone-300 px-2.5 text-xs font-medium">
                          {restaurant.price_level === 'PRICE_LEVEL_VERY_EXPENSIVE'
                            ? '$$$$'
                            : restaurant.price_level === 'PRICE_LEVEL_EXPENSIVE'
                              ? '$$$'
                              : restaurant.price_level === 'PRICE_LEVEL_MODERATE'
                                ? '$$'
                                : restaurant.price_level === 'PRICE_LEVEL_INEXPENSIVE'
                                  ? '$'
                                  : null}
                        </div>
                      )
                    : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {restaurant.phone && (
                <a className={button({ scheme: 'outline' })} href={`tel:${restaurant.phone}`} target="_blank" rel="noopener noreferrer">
                  <span className="icon-[material-symbols--call] size-4" />
                  <span>{restaurant.phone}</span>
                </a>
              )}
              <a className={button({ scheme: 'blueberry' })} href={restaurant.website ?? undefined} target="_blank" rel="noopener noreferrer">
                <span>View Website</span>
                <div aria-hidden="true" className="icon-[material-symbols--arrow-forward-rounded] size-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left Column - Details */}
          <div className="md:col-span-2">
            {/* Long Description */}
            {restaurant.description && (
              <div className="prose-lg mt-8 max-w-none prose-stone">
                <p>{restaurant.description}</p>
              </div>
            )}
          </div>

          {/* Right Column - Hours */}
          <div>
            <div className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200">

              <div className="p-4">
                <h2 className="text-sm font-semibold tracking-widest text-stone-600 uppercase">Hours</h2>
                {restaurant.opening_hours
                  ? (
                      <div className="mt-3 divide-y divide-stone-200 text-sm text-stone-500">
                        {restaurant.opening_hours.map((schedule) => {
                          const isToday = schedule.day === new Date().getDay()
                          const isClosed = schedule.open === '00:00' && schedule.close === '00:00'
                          return (
                            <div
                              key={schedule.day}
                              className={cn([
                                `flex items-center justify-between py-2 last:pb-0`,
                                isToday && '-mx-2 rounded-lg border-b-0 bg-stone-100 px-2 font-medium text-black',
                              ])}
                            >
                              <div className="flex items-center gap-2">
                                {isToday && <span className="size-1.5 rounded-full bg-black" />}
                                <span>{dayNames[schedule.day]}</span>
                              </div>
                              <span className={isClosed ? 'text-red-800' : ''}>
                                {isClosed ? 'Closed' : `${schedule.open} - ${schedule.close}`}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  : (
                      <p className="text-gray-500">Hours not available</p>
                    )}
              </div>

              <div>
                {/* Map */}
                <div className="p-4">
                  <h2 className="text-sm font-semibold tracking-widest text-stone-600 uppercase">Address</h2>
                  <div className="flex items-center gap-2">
                    {restaurant.address && (
                      <div className="mt-3 text-sm text-gray-700">
                        <p>{restaurant.street_address}</p>
                        <p>
                          {restaurant.city}
                          ,
                          {restaurant.state}
                          {' '}
                          {restaurant.postal_code}
                        </p>
                      </div>
                    )}
                    <a className={button({ scheme: 'outline', className: 'ml-auto shrink-0' })} href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address ?? [restaurant.street_address, restaurant.city, restaurant.state].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer">
                      <span className="icon-[material-symbols--directions-car] size-4" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
                <div className="aspect-video w-full bg-stone-100 ">
                  <React.Suspense>
                    <MapboxCloseup
                      lat={restaurant.latitude || 0}
                      lng={restaurant.longitude || 0}
                    />
                  </React.Suspense>
                </div>

              </div>
            </div>


          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-6 border-b border-b-slate-200 pb-2 font-pretrona text-3xl font-semibold tracking-tight">Try something nearby</h2>

        <div className="grid grid-cols-3 gap-6">
          {nearby?.map(restaurant => (
            <PlaceCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </div>

    </div>
  )
}
