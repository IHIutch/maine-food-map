import * as React from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { withDb } from '../utils/prisma'
import { NotFound } from '../components/NotFound'
import { seo } from '../utils/seo'
import { trackEvent } from 'fathom-client'
import { baseUrl } from '../utils/base-url'
import { button } from '../components/ui';
import { cn } from 'tailwind-variants'
import { z } from 'zod'
const MapboxCloseup = React.lazy(() => import('../components/mapbox-closeup'))

const restaurantPhotoSchema = z.object({
  url: z.string().optional(),
})

const openingHourSchema = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string(),
  close: z.string(),
})

const openingHoursSchema = z.array(openingHourSchema)
const restaurantPhotosSchema = z.array(restaurantPhotoSchema)
const restaurantTagsSchema = z.array(z.string())

const restaurantDetailsSchema = z.object({
  id: z.number(),
  slug: z.string(),
  title: z.string(),
  website: z.string().nullable(),
  description: z.string().nullable(),
  rating: z.number().nullable(),
  review_count: z.number().nullable(),
  rating_source: z.string().nullable(),
  photos: restaurantPhotosSchema,
  price_level: z.string().nullable(),
  business_status: z.string().nullable(),
  phone: z.string().nullable(),
  opening_hours: openingHoursSchema.nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  street_address: z.string().nullable(),
  state: z.string().nullable(),
  city: z.string().nullable(),
  postal_code: z.string().nullable(),
  tags: restaurantTagsSchema,
  isOpen: z.boolean(),
  todayHours: z.string().nullable(),
  restaurant_categories: z.array(z.object({
    categories: z.object({
      id: z.number(),
      slug: z.string(),
      display_name: z.string(),
      restaurant_count: z.number().nullable(),
    }),
  })),
})

type RestaurantDetails = z.infer<typeof restaurantDetailsSchema>

function parseJsonField<T>(value: string | null, schema: z.ZodType<T>): T | null {
  if (!value) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    throw new Error('Invalid JSON in restaurant data')
  }

  return schema.parse(parsed)
}

// Server function to fetch restaurant by slug
const getRestaurantBySlug = createServerFn({ method: 'GET' })
  .validator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { slug } = data
    const restaurant = await withDb(async (db) =>
      await db.orm.public.restaurants
        .include('restaurant_categories', (restaurantCategories) =>
          restaurantCategories.include('categories'),
        )
        .first({ slug }),
    )

    if (!restaurant) {
      throw new Error('Restaurant not found')
    }

    // Parse JSON fields and check if open
    const opening_hours = parseJsonField(restaurant.opening_hours, openingHoursSchema)

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
      id: restaurant.id,
      slug: restaurant.slug,
      title: restaurant.title,
      website: restaurant.website,
      description: restaurant.description,
      rating: restaurant.rating,
      review_count: restaurant.review_count,
      rating_source: restaurant.rating_source,
      photos: parseJsonField(restaurant.photos, restaurantPhotosSchema) ?? [],
      price_level: restaurant.price_level,
      business_status: restaurant.business_status,
      phone: restaurant.phone,
      opening_hours,
      address: restaurant.address,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      street_address: restaurant.street_address,
      state: restaurant.state,
      city: restaurant.city,
      postal_code: restaurant.postal_code,
      tags: parseJsonField(restaurant.tags, restaurantTagsSchema) ?? [],
      isOpen,
      todayHours,
      restaurant_categories: restaurant.restaurant_categories.map(({ categories }) => ({
        categories: {
          id: categories.id,
          slug: categories.slug,
          display_name: categories.display_name,
          restaurant_count: categories.restaurant_count,
        },
      })),
    }

    return parsedRestaurant
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
      "openingHoursSpecification": loaderData.opening_hours ? loaderData.opening_hours.map((schedule) => {
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
      "servesCuisine": loaderData.restaurant_categories?.map((rc) => rc.categories.display_name) || undefined,
      "priceRange": loaderData.price_level ? "$".repeat(parseInt(loaderData.price_level)) : undefined,
      "image": loaderData.photos?.length > 0 ? loaderData.photos.map((photo) =>
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
    <div className="py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-5xl font-pretrona font-semibold tracking-tight">{restaurant?.title}</h1>
              <div className="flex items-center gap-3 mt-5">
                {/* Status */}
                {restaurant.isOpen ? (
                  <div className="flex items-center px-2.5 h-7 rounded-full gap-1.5 bg-green-800/10">
                    <span className="size-2 bg-green-800 rounded-full" />
                    <span className="font-medium text-xs text-green-800">Open</span>
                  </div>
                ) : (
                  <div className="flex items-center px-2.5 h-7 rounded-full gap-1.5 bg-red-800/10">
                    <span className="size-2 bg-red-800 rounded-full" />
                    <span className="font-medium text-xs text-red-800">Closed</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {/* Tags */}
                  {restaurant.tags.length > 0 && restaurant.tags.map((tag) => (
                    <div key={tag} className="h-7 border border-stone-300 flex items-center rounded-full px-2.5 text-xs font-medium">
                      {tag}
                    </div>
                  ))}
                  {/* Price */}
                  {restaurant.price_level ? (
                    <div className="h-7 border border-stone-300 flex items-center rounded-full px-2.5 text-xs font-medium">
                      {restaurant.price_level === 'PRICE_LEVEL_VERY_EXPENSIVE' ? '$$$$'
                        : restaurant.price_level === 'PRICE_LEVEL_EXPENSIVE' ? "$$$"
                          : restaurant.price_level === 'PRICE_LEVEL_MODERATE' ? "$$"
                            : restaurant.price_level === 'PRICE_LEVEL_INEXPENSIVE' ? "$"
                              : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className={button({ scheme: 'outline' })}>
                <div aria-hidden="true" className="size-4 icon-[material-symbols--heart-plus-outline]" />
                <span>3 Likes</span>
              </button>
              {restaurant.phone && (
                <a className={button({ scheme: 'outline' })} href={`tel:${restaurant.phone}`} target="_blank" rel="noopener noreferrer">
                  <span className="size-4 icon-[material-symbols--call]" />
                  <span>{restaurant.phone}</span>
                </a>
              )}
              <a className={button({ scheme: 'blueberry' })} href={restaurant.website ?? undefined} target="_blank" rel="noopener noreferrer">
                <span>View Website</span>
                <div aria-hidden="true" className="size-4 icon-[material-symbols--arrow-forward-rounded]" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Left Column - Details */}
          <div className="md:col-span-2">
            {/* Photos */}
            <div>
              {restaurant.photos.length > 0 && (
                <div className="grid grid-cols-3 grid-rows-3 gap-3 w-full">
                  {restaurant.photos.slice(0, 4).map((photo, index) => index === 0 ? (
                    <div key={index} className="col-span-2 row-span-3 rounded-xl bg-stone-100 overflow-hidden">
                      <img className="size-full object-cover" src={`https://picsum.photos/1280/720`} />
                    </div>
                  ) : (
                    <div key={index} className="col-span-1 row-span-1 rounded-xl bg-stone-100 overflow-hidden aspect-16/9">
                      <img className="size-full object-cover" src={`https://picsum.photos/1280/720`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Intro */}
            <div className="font-pretrona text-2xl text-stone-700 mt-12">
              <p>A twelve-hour broth, noodles cut in house, and a counter that stays open after most of Camden has gone quiet — the off-season lifeline of the harbor.</p>
            </div>

            {/* Long Description */}
            {restaurant.description && (
              <div className="prose-lg prose-stone max-w-none mt-8">
                <p>{restaurant.description}</p>
              </div>
            )}
          </div>

          {/* Right Column - Hours */}
          <div>
            <div className="border border-stone-200 rounded-xl divide-y divide-stone-200 overflow-hidden">
              <div>
                {/* Map */}
                <div className="w-full aspect-video bg-stone-100 ">
                  <React.Suspense>
                    <MapboxCloseup
                      lat={restaurant.latitude || 0}
                      lng={restaurant.longitude || 0}
                    />
                  </React.Suspense>
                </div>
                <div className="p-4">
                  <h2 className="text-sm uppercase tracking-widest font-semibold text-stone-600">Address</h2>
                  <div className="flex items-center gap-2">
                    {restaurant.address && (
                      <div className="text-gray-700 mt-3 text-sm">
                        <p>{restaurant.street_address}</p>
                        <p>
                          {restaurant.city}, {restaurant.state} {restaurant.postal_code}
                        </p>
                      </div>
                    )}
                    <a className={button({ scheme: 'outline', className: 'ml-auto shrink-0' })}>
                      <span className="size-4 icon-[material-symbols--directions-car]" />
                      <span>Directions</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h2 className="text-sm uppercase tracking-widest font-semibold text-stone-600">Hours</h2>
                {restaurant.opening_hours ? (
                  <div className="divide-stone-200 divide-y mt-3 text-stone-500 text-sm">
                    {restaurant.opening_hours.map((schedule) => {
                      const isToday = schedule.day === new Date().getDay()
                      const isClosed = schedule.open === "00:00" && schedule.close === "00:00"
                      return (
                        <div
                          key={schedule.day}
                          className={cn([
                            `flex justify-between items-center py-2 last:pb-0`,
                            isToday && 'font-medium text-black bg-stone-100 rounded-lg -mx-2 px-2 border-b-0'
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
                ) : (
                  <p className="text-gray-500">Hours not available</p>
                )}
              </div>
            </div>

            <div className="mt-3 px-4">
              <div className="flex items-center justify-center text-sm gap-2">
                <span className="text-stone-600">Something look wrong?</span>
                <button className="text-blueberry-500 font-semibold flex items-center gap-1 cursor-pointer underline hover:text-blueberry-600">
                  <span>Report an error</span>
                  <div aria-hidden="true" className="size-4 icon-[material-symbols--error-rounded]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-20">
        <div className="border-b border-stone-200">
          <h2 className="text-3xl font-pretrona font-semibold tracking-tight pb-2">Try something similar</h2>

          <div className="grid grid-cols-3 gap-6">

          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-20">
        <div className="border-b border-stone-200">
          <h2 className="text-3xl font-pretrona font-semibold tracking-tight pb-2">Or something nearby</h2>

          <div className="grid grid-cols-3 gap-6">

          </div>
        </div>
      </div>
    </div>
  )
}
