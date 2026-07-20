import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { NotFound } from '../components/NotFound'
import { seo } from '../utils/seo'
import { trackEvent } from 'fathom-client'
import { baseUrl } from '../utils/base-url'
import { LikeButton } from '../components/LikeButton'
import { getLikesForRestaurant } from '../server/likes'
import { computeIsOpen, formatTodayHours, getMaineNow } from '../utils/opening-hours'
import { jsonForScript } from '../utils/escape'
import * as z from 'zod'
import { brandCaps, displayHeading, metaLabel, metaRow, statusMark } from '../components/ui'

function safeWebsiteHref(website: string, ref: string): string | null {
  try {
    const u = new URL(website)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    u.searchParams.set('ref', ref)
    return u.toString()
  } catch {
    return null
  }
}

// Server function to fetch restaurant by slug
const getRestaurantBySlug = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string().min(1).max(200) }).parse)
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
      throw notFound()
    }

    // Parse JSON fields and check if open
    const opening_hours = restaurant.opening_hours ? JSON.parse(restaurant.opening_hours) : null
    const key = process.env.GOOGLE_PLACES_API_KEY
    const photos: Array<{ url: string; attribution?: string }> = !key || !restaurant.photos
      ? []
      : (JSON.parse(restaurant.photos) as Array<{ url?: string; attribution?: string }>)
          .filter((photo): photo is { url: string; attribution?: string } => Boolean(photo.url))
          .map((photo) => ({
            url: photo.url.includes('YOUR_API_KEY') ? photo.url.replace('YOUR_API_KEY', key) : photo.url,
            attribution: photo.attribution,
          }))

    const parsedRestaurant = {
      ...restaurant,
      tags: restaurant.tags ? JSON.parse(restaurant.tags) : [],
      photos,
      opening_hours,
      isOpen: computeIsOpen(opening_hours),
      todayHours: formatTodayHours(opening_hours),
      todayDay: getMaineNow().day
    }

    return parsedRestaurant
  })

export const Route = createFileRoute('/places/$slug')({
  loader: async ({ params, context }) => {
    const restaurant = await getRestaurantBySlug({ data: { slug: params.slug } })
    const likes = restaurant.public_id
      ? await getLikesForRestaurant({
          data: { publicId: restaurant.public_id },
        })
      : { totalLikes: 0, userHasLiked: false }
    return {
      restaurant,
      likes,
      isAuthenticated: !!(context as any)?.user,
    }
  },
  component: RestaurantPage,
  notFoundComponent: () => <NotFound />,
  errorComponent: () => <div>Something went wrong loading this restaurant.</div>,
  head: ({ loaderData }) => {
    const restaurant = loaderData?.restaurant
    // Create structured data for the restaurant
    const structuredData = restaurant ? {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": restaurant.title,
      "description": restaurant.description || "",
      "url": `${baseUrl}/places/${restaurant.slug}`,
      "address": restaurant.street_address ? {
        "@type": "PostalAddress",
        "streetAddress": restaurant.street_address,
        "addressLocality": restaurant.city,
        "addressRegion": restaurant.state,
        "postalCode": restaurant.postal_code,
        "addressCountry": "US"
      } : undefined,
      "telephone": restaurant.phone || undefined,
      "sameAs": restaurant.website || undefined,
      "aggregateRating": restaurant.rating ? {
        "@type": "AggregateRating",
        "ratingValue": restaurant.rating,
        "reviewCount": restaurant.review_count || 1,
        "bestRating": 5,
        "worstRating": 1
      } : undefined,
      "geo": (restaurant.latitude && restaurant.longitude) ? {
        "@type": "GeoCoordinates",
        "latitude": restaurant.latitude,
        "longitude": restaurant.longitude
      } : undefined,
      "openingHoursSpecification": restaurant.opening_hours ? restaurant.opening_hours.map((schedule: any) => {
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
      "servesCuisine": restaurant.restaurant_categories?.map((rc: any) => rc.categories.display_name) || undefined,
      "priceRange": restaurant.price_level ? "$".repeat(parseInt(restaurant.price_level)) : undefined,
      "image": restaurant.photos?.length > 0 ? restaurant.photos.map((photo) => photo.url) : undefined
    } : null;

    return {
      meta: [
        ...seo({
          title: `${restaurant?.title} | MaineFoodMap`,
          description: restaurant?.description || "",
        }),
      ],
      links: [{
        rel: 'canonical',
        href: `${baseUrl}/places/${restaurant?.slug}`,
      }],
      scripts: structuredData ? [{
        type: 'application/ld+json',
        children: jsonForScript(structuredData)
      }] : []
    };
  },
})

function RestaurantPage() {
  const { restaurant, likes, isAuthenticated } = Route.useLoaderData()
  const websiteHref = restaurant.website
    ? safeWebsiteHref(restaurant.website, baseUrl)
    : null

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero — full-bleed tone-on-tone color field */}
      <div className="bg-sage-tint">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
          {(restaurant.city || restaurant.state) && (
            <p className={metaLabel({ className: 'text-pine mb-4' })}>
              {[restaurant.city, restaurant.state].filter(Boolean).join(', ')}
            </p>
          )}
          <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4 mb-6">
            <h1 className={displayHeading({ className: 'text-5xl sm:text-7xl text-pine max-w-2xl' })}>
              {restaurant.title}
            </h1>
            {restaurant.rating && (
              <div className="text-right">
                <span className={displayHeading({ className: 'text-6xl sm:text-7xl text-pine' })}>
                  {restaurant.rating}
                </span>
                <p className={metaLabel({ className: 'text-ink-soft mt-2' })}>
                  {restaurant.review_count} reviews
                </p>
              </div>
            )}
          </div>

          {restaurant.description && (
            <p className="text-ink-soft text-lg max-w-2xl mb-8">{restaurant.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className={metaRow({ className: 'text-ink-soft' })}>
              <span className={statusMark({ open: restaurant.isOpen })}>
                {restaurant.isOpen ? 'Open now' : 'Closed'}
              </span>
              {restaurant.tags
                .filter((tag: string) => !/^open now$/i.test(tag))
                .map((tag: string) => (
                  <span key={tag}>· {tag}</span>
                ))}
            </div>

            {restaurant.public_id && (
              <LikeButton
                publicId={restaurant.public_id}
                slug={restaurant.slug}
                initialTotal={likes.totalLikes}
                initialLiked={likes.userHasLiked}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        {/* Editorial sections split by hairline rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12">
          {/* Left column — contact + photos */}
          <div className="md:col-span-2">
            <section className="pb-10">
              <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-6' })}>Contact</h2>

              <div className="space-y-5">
                {restaurant.address && (
                  <div>
                    <p className={metaLabel({ className: 'text-ink-soft mb-1' })}>Address</p>
                    <p className="font-medium">{restaurant.street_address}</p>
                    <p className="text-ink-soft">
                      {restaurant.city}, {restaurant.state} {restaurant.postal_code}
                    </p>
                  </div>
                )}

                {restaurant.phone && (
                  <div>
                    <p className={metaLabel({ className: 'text-ink-soft mb-1' })}>Phone</p>
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="text-blueberry underline underline-offset-4 decoration-blueberry/40 hover:decoration-blueberry"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}

                {websiteHref && (
                  <div>
                    <p className={metaLabel({ className: 'text-ink-soft mb-1' })}>Website</p>
                    <a
                      href={websiteHref}
                      onClick={() => {
                        trackEvent(`website_click: ${restaurant.slug}`);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blueberry underline underline-offset-4 decoration-blueberry/40 hover:decoration-blueberry"
                    >
                      Visit Website →
                    </a>
                  </div>
                )}

                {restaurant.public_id && (
                  <div>
                    <p className={metaLabel({ className: 'text-ink-soft mb-1' })}>Something wrong?</p>
                    <Link
                      to="/report"
                      search={{ kind: 'place_error', place: restaurant.public_id }}
                      className="text-blueberry underline underline-offset-4 decoration-blueberry/40 hover:decoration-blueberry"
                    >
                      Report an error →
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {restaurant.photos.length > 0 && (
              <section className="pt-10 pb-10 border-t border-ink/15">
                <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-6' })}>Photos</h2>
                <div className="grid grid-cols-2 gap-4">
                  {restaurant.photos.slice(0, 4).map((photo: any, index: number) => (
                    <figure key={index}>
                      <div className="aspect-[4/5] bg-cream rounded-t-full rounded-b-2xl overflow-hidden">
                        <img
                          src={photo.url}
                          alt={`${restaurant.title} photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {photo.attribution && (
                        <figcaption className={metaLabel({ className: 'text-ink-soft mt-2 text-center normal-case tracking-normal text-xs font-normal' })}>
                          Photo by {photo.attribution}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right column — hours + categories */}
          <div className="border-t md:border-t-0 md:border-l border-ink/15 pt-10 md:pt-0 md:pl-12">
            <section className="pb-10">
              <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-6' })}>Hours</h2>

              {restaurant.opening_hours ? (
                <div>
                  <div className="mb-5 px-4 py-3 bg-butter-tint rounded-xl">
                    <p className={metaLabel({ className: 'text-ink-soft mb-0.5' })}>Today</p>
                    <p className="font-medium">{restaurant.todayHours || 'Hours not available'}</p>
                  </div>

                  {restaurant.opening_hours.map((schedule: any) => {
                    const isToday = schedule.day === restaurant.todayDay
                    const isClosed = schedule.open === "00:00" && schedule.close === "00:00"

                    return (
                      <div
                        key={schedule.day}
                        className={`flex justify-between py-2 text-sm border-b border-ink/10 last:border-b-0 ${isToday ? 'font-semibold text-pine' : ''}`}
                      >
                        <span>{dayNames[schedule.day]}</span>
                        <span className={isClosed ? 'text-ink-soft' : ''}>
                          {isClosed ? 'Closed' : `${schedule.open} - ${schedule.close}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-ink-soft">Hours not available</p>
              )}
            </section>

            {restaurant.restaurant_categories.length > 0 && (
              <section className="pt-10 border-t border-ink/15">
                <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-6' })}>Categories</h2>
                <div className={metaRow({ className: 'text-plum' })}>
                  {restaurant.restaurant_categories.map((rc: any, i: number) => (
                    <span key={rc.category_id}>
                      {i > 0 && '· '}
                      {rc.categories.display_name}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
