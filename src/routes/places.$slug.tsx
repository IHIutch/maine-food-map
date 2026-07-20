import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { NotFound } from '../components/NotFound'
import { seo } from '../utils/seo'
import { trackEvent } from 'fathom-client'
import { baseUrl } from '../utils/base-url'
import { LikeButton } from '../components/LikeButton'
import { PhotoUpload } from '../components/PhotoUpload'
import { getLikesForRestaurant } from '../server/likes'
import { computeIsOpen, formatTodayHours, getMaineNow } from '../utils/opening-hours'
import { jsonForScript } from '../utils/escape'
import * as z from 'zod'
import { button, displayHeading, eyebrow, lede, metaLabel, sectionTitle, tag } from '../components/ui'

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

    // Approved community photos. No cacheStrategy: approvals must appear promptly.
    const photos = await prisma.photos.findMany({
      where: { restaurant_id: restaurant.id, status: 'approved' },
      orderBy: { reviewed_at: 'desc' },
      select: {
        id: true,
        r2_key: true,
        alt_text: true,
        uploader_handle: true,
      },
    })

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
      "image": restaurant.photos?.length > 0 ? restaurant.photos.map((photo) => `${baseUrl}/img/${photo.r2_key}`) : undefined
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
  const categories = restaurant.restaurant_categories.map(
    (rc: any) => rc.categories.display_name,
  )
  const websiteLabel = restaurant.website
    ? restaurant.website.replace(/^https?:\/\//, '').replace(/\/$/, '')
    : null

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-[1320px] px-6 sm:px-11 pt-10 pb-20">
        {/* Breadcrumb */}
        <nav className={metaLabel({ className: 'mb-7 text-ink-soft' })}>
          <Link to="/" className="border-b border-ink/20 pb-px hover:border-ink">
            All places
          </Link>
          {restaurant.city && (
            <>
              <span className="mx-2 opacity-50">/</span>
              <span>{restaurant.city}</span>
            </>
          )}
          <span className="mx-2 opacity-50">/</span>
          <span>{restaurant.title}</span>
        </nav>

        {/* Header */}
        <section className="md:grid md:grid-cols-[1.1fr_1fr] md:items-end gap-12 mb-7">
          <div>
            <p className={eyebrow({ bar: true, className: 'mb-3.5' })}>
              {[categories.join(' · '), [restaurant.city, restaurant.state].filter(Boolean).join(', ')]
                .filter(Boolean)
                .join(' · ')}
            </p>
            <h1 className={displayHeading({ className: 'text-5xl sm:text-7xl xl:text-8xl leading-[0.9] tracking-[-0.025em] mb-6' })}>
              {restaurant.title}
            </h1>
            {restaurant.description && (
              <p className={lede({ className: 'mb-6 max-w-xl text-[22px]' })}>
                {restaurant.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2.5">
              <span className={tag({ intent: 'status', open: restaurant.isOpen })}>
                {restaurant.isOpen ? 'Open now' : 'Closed'}
                {restaurant.todayHours && restaurant.todayHours !== 'Closed'
                  ? ` · Today ${restaurant.todayHours}`
                  : ''}
              </span>
              {restaurant.price_level && (
                <span className={tag({ intent: 'price' })}>
                  {'$'.repeat(parseInt(restaurant.price_level))}
                </span>
              )}
              {restaurant.rating && (
                <span className={tag({ intent: 'price' })}>
                  ★ {restaurant.rating}
                  {restaurant.review_count ? ` · ${restaurant.review_count} reviews` : ''}
                </span>
              )}
              {restaurant.tags
                .filter((t: string) => !/^open now$/i.test(t))
                .slice(0, 2)
                .map((t: string) => (
                  <span key={t} className={tag()}>{t}</span>
                ))}
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-2.5 md:justify-end md:pb-2.5">
            {restaurant.public_id && (
              <LikeButton
                publicId={restaurant.public_id}
                slug={restaurant.slug}
                initialTotal={likes.totalLikes}
                initialLiked={likes.userHasLiked}
                isAuthenticated={isAuthenticated}
              />
            )}
            {websiteHref && (
              <a
                href={websiteHref}
                onClick={() => {
                  trackEvent(`website_click: ${restaurant.slug}`);
                }}
                target="_blank"
                rel="noopener noreferrer"
                className={button({ intent: 'accent' })}
              >
                Visit website →
              </a>
            )}
          </div>
        </section>

        {/* Gallery */}
        {restaurant.photos.length > 0 && (
          <section className="mb-13">
            <div className="grid gap-2.5 mb-4 grid-cols-2 md:grid-cols-[2fr_1fr_1fr] md:grid-rows-[280px_280px]">
              {restaurant.photos.slice(0, 5).map((photo, index: number) => (
                <div
                  key={photo.id}
                  className={`overflow-hidden rounded-[10px] bg-cream ${
                    index === 0 ? 'col-span-2 md:col-span-1 md:row-span-2' : ''
                  }`}
                >
                  <img
                    src={`/img/${photo.r2_key}`}
                    alt={photo.alt_text ?? `${restaurant.title} photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-soft">
              {restaurant.photos.slice(0, 5).map((photo, index: number) => (
                <span key={photo.id}>
                  Photo {index + 1} —{' '}
                  {photo.uploader_handle ? (
                    <a
                      href={`https://bsky.app/profile/${photo.uploader_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 decoration-ink/30 hover:decoration-ink"
                    >
                      @{photo.uploader_handle}
                    </a>
                  ) : (
                    'contributed'
                  )}
                  {' · '}
                  <Link
                    to="/report"
                    search={{ kind: 'photo', photo: photo.id }}
                    className="underline underline-offset-2 decoration-ink/30 hover:decoration-ink"
                  >
                    Report
                  </Link>
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Body */}
        <section className="mt-10 md:grid md:grid-cols-[1.4fr_1fr] gap-16">
          <div>
            <h2 className={sectionTitle()}>Photos & contributions</h2>
            {restaurant.photos.length === 0 && (
              <p className={lede({ className: 'text-lg text-ink-soft mb-6' })}>
                Been here? Add the first photo and help other people find it.
              </p>
            )}
            {restaurant.public_id && (
              <PhotoUpload
                restaurantPublicId={restaurant.public_id}
                restaurantTitle={restaurant.title}
                isAuthenticated={isAuthenticated}
              />
            )}
          </div>

          <aside className="mt-12 md:mt-0">
            <div className="sticky top-24 rounded-xl border border-ink/15 bg-cream p-1">
              <div className="rounded-[9px] bg-paper px-6 py-5">
                {restaurant.street_address && (
                  <div className="border-b border-ink/10 py-4 first:pt-0">
                    <p className={metaLabel({ className: 'text-[10.5px] text-ink-soft mb-2' })}>Address</p>
                    <p className="font-display text-[19px] leading-[1.4]">
                      {restaurant.street_address}
                      <br />
                      {restaurant.city}, {restaurant.state} {restaurant.postal_code}
                    </p>
                  </div>
                )}

                {restaurant.phone && (
                  <div className="border-b border-ink/10 py-4 first:pt-0">
                    <p className={metaLabel({ className: 'text-[10.5px] text-ink-soft mb-2' })}>Phone</p>
                    <a
                      href={`tel:${restaurant.phone}`}
                      className="font-display text-[19px] leading-[1.4] border-b border-ink/20 hover:border-ink"
                    >
                      {restaurant.phone}
                    </a>
                  </div>
                )}

                {websiteHref && (
                  <div className="border-b border-ink/10 py-4 first:pt-0">
                    <p className={metaLabel({ className: 'text-[10.5px] text-ink-soft mb-2' })}>Website</p>
                    <a
                      href={websiteHref}
                      onClick={() => {
                        trackEvent(`website_click: ${restaurant.slug}`);
                      }}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-display text-[19px] leading-[1.4] border-b border-ink/20 hover:border-ink break-all"
                    >
                      {websiteLabel}
                    </a>
                  </div>
                )}

                <div className="border-b border-ink/10 py-4 first:pt-0">
                  <p className={metaLabel({ className: 'text-[10.5px] text-ink-soft mb-2' })}>Hours</p>
                  {restaurant.opening_hours ? (
                    <div className="mt-2.5">
                      {restaurant.opening_hours.map((schedule: any) => {
                        const isToday = schedule.day === restaurant.todayDay
                        const isClosed = schedule.open === "00:00" && schedule.close === "00:00"

                        return (
                          <div
                            key={schedule.day}
                            className={`flex justify-between py-1.5 text-[14.5px] ${
                              isToday ? '-mx-2.5 rounded-md bg-accent-tint px-2.5 font-semibold' : ''
                            }`}
                          >
                            <span className={`font-mono text-[11px] uppercase tracking-[0.08em] self-center ${isToday ? 'text-ink' : 'text-ink-soft'}`}>
                              {dayNames[schedule.day]}
                              {isToday ? ' · Today' : ''}
                            </span>
                            <span className={isClosed && !isToday ? 'text-ink-soft' : ''}>
                              {isClosed ? 'Closed' : `${schedule.open} – ${schedule.close}`}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-ink-soft text-sm">Hours not available</p>
                  )}
                </div>

                {restaurant.public_id && (
                  <div className="py-4 last:pb-0">
                    <Link
                      to="/report"
                      search={{ kind: 'place_error', place: restaurant.public_id }}
                      className={button({ intent: 'secondary', className: 'w-full justify-start gap-2' })}
                    >
                      ⓘ Report an issue with this listing
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  )
}
