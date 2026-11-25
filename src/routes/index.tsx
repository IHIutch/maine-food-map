import { createFileRoute, Link, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import { computeIsOpen } from '../utils/opening-hours'
import { baseUrl } from '../utils/base-url'
import { useMemo, useState, lazy, Suspense } from 'react'
import * as z from 'zod'
import { lede, metaLabel, pillFilter, tag } from '../components/ui'

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

const TOWN_COUNT = 5

function PlacesIndex() {
  const { restaurants } = Route.useLoaderData()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const [town, setTown] = useState<string>('all')
  const [openNow, setOpenNow] = useState(false)
  const { view } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })

  const towns = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of restaurants) {
      if (r.city) counts.set(r.city, (counts.get(r.city) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOWN_COUNT)
      .map(([city]) => city)
  }, [restaurants])

  const townCount = useMemo(
    () => new Set(restaurants.map((r) => r.city).filter(Boolean)).size,
    [restaurants],
  )

  const filtered = restaurants.filter((r) => {
    if (town !== 'all' && r.city !== town) return false
    if (openNow && !r.isOpen) return false
    return true
  })

  return (
    <div className="fixed pt-16 inset-0 bg-paper flex flex-col z-0">
      {/* Mobile Toggle */}
      <div className="lg:hidden sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-ink/10 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className={metaLabel({ className: 'text-ink-soft' })}>
            {filtered.length} places
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
              className={pillFilter({ active: view === 'list' })}
            >
              List
            </button>
            <button
              onClick={() => {
                navigate({
                  to: "/",
                  search: (old) => ({ ...old, view: 'map' }),
                });
              }}
              className={pillFilter({ active: view === 'map' })}
            >
              Map
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 h-full min-h-0 lg:grid lg:grid-cols-[1.05fr_1fr] flex">
        {/* List rail - Hidden on mobile when map is showing */}
        <div className={`${view === 'map' ? 'hidden' : 'block'} lg:block w-full overflow-y-auto h-full lg:border-r lg:border-ink/15 bg-paper`}>
          {/* Hero strap */}
          <div className="relative hidden lg:block border-b border-ink/15 bg-accent px-10 py-14 text-paper after:absolute after:bottom-10 after:right-10 after:h-0.5 after:w-30 after:bg-ink after:content-['']">
            <p className={metaLabel({ className: 'text-paper/70' })}>
              Field guide · Updated weekly
            </p>
            <h1 className="mt-3.5 mb-6 font-display text-[56px] xl:text-[80px] font-normal leading-[0.92] tracking-[-0.015em] text-paper">
              Where to eat
              <br />
              in <em className="italic text-ink">Maine</em>, from
              <br />
              lobster pounds to
              <br />
              late-night pie.
            </h1>
            <p className={lede({ className: 'max-w-xl text-[22px] text-paper/80' })}>
              A statewide guide to the places worth driving for — hours, photos,
              and community likes.
            </p>
            <div className="mt-8 flex max-w-xl gap-10 border-t border-paper/20 pt-6">
              <div className="flex flex-col">
                <span className="font-display text-[40px] leading-none text-paper">{restaurants.length}</span>
                <span className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-paper/60">Places</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[40px] leading-none text-paper">{townCount}</span>
                <span className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-paper/60">Towns</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-[40px] leading-none text-paper">2026</span>
                <span className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-paper/60">Edition</span>
              </div>
            </div>
          </div>

          {/* Sticky filter bar */}
          <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2.5 border-b border-ink/15 bg-paper px-4 sm:px-7 py-4">
            <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-soft">Town</span>
            <button
              onClick={() => setTown('all')}
              className={pillFilter({ active: town === 'all' })}
            >
              All Maine
            </button>
            {towns.map((t) => (
              <button
                key={t}
                onClick={() => setTown(town === t ? 'all' : t)}
                className={pillFilter({ active: town === t })}
              >
                {t}
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-ink/15" />
            <span className="mr-1 font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-soft">Status</span>
            <button
              onClick={() => setOpenNow(!openNow)}
              className={pillFilter({ active: openNow })}
            >
              Open now
            </button>
            <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.08em] text-ink-soft">
              {filtered.length} Showing
            </span>
          </div>

          {/* Editorial list */}
          <div className="px-4 sm:px-7 pb-16">
            {filtered.map((restaurant, index) => {
              const isSelected = selectedRestaurant === restaurant.id
              const firstTag = restaurant.tags.filter(
                (t: string) => !/^open now$/i.test(t),
              )[0]
              return (
                <Link
                  key={restaurant.id}
                  to="/places/$slug"
                  params={{ slug: restaurant.slug }}
                  className={`grid grid-cols-[96px_1fr] sm:grid-cols-[144px_1fr] gap-5 rounded px-4 py-5 border-b border-ink/10 transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    isSelected ? 'bg-cream' : ''
                  }`}
                >
                  <div className="relative size-24 sm:size-36 overflow-hidden rounded-lg bg-cream">
                    <div className="grid h-full place-items-center font-display text-4xl text-ink-soft/40">
                      {restaurant.title[0]}
                    </div>
                    <div className="absolute left-2 top-2 grid size-[26px] place-items-center rounded-full bg-accent font-mono text-[11px] font-medium text-white ring-2 ring-white">
                      {index + 1}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h2 className="font-display text-[26px] sm:text-3xl font-normal leading-none tracking-[-0.01em]">
                        {restaurant.title}
                      </h2>
                      {firstTag && (
                        <span className={metaLabel({ className: 'text-ink-soft tracking-[0.08em]' })}>
                          {firstTag}
                        </span>
                      )}
                    </div>
                    {restaurant.description && (
                      <p className="mt-2 mb-3 text-[14.5px] leading-relaxed text-ink line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={tag({ intent: 'status', open: restaurant.isOpen })}>
                        {restaurant.isOpen ? 'Open now' : 'Closed'}
                      </span>
                      {restaurant.rating && (
                        <span className={tag({ intent: 'price' })}>★ {restaurant.rating}</span>
                      )}
                      {restaurant.city && (
                        <span className="inline-flex items-center gap-1 text-[12.5px] text-ink-soft">
                          {restaurant.city}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Map View - Hidden on mobile when list is showing */}
        <div className={`${view === 'list' ? 'hidden' : 'block'} lg:block w-full h-full sticky top-0`}>
          <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-cream">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                <p className="text-ink-soft">Loading map...</p>
              </div>
            </div>
          }>
            <MapboxEmbed
              places={filtered}
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
