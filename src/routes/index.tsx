import { createFileRoute, Link, stripSearchParams, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { withDb } from '../utils/prisma'
import { useMemo, useState, lazy, Suspense } from 'react'
import * as z from 'zod'
import { button, metaLabel, pillFilter, tag } from '../components/ui'
import { cn } from 'tailwind-variants'

const MapboxEmbed = lazy(() => import('../components/mapbox-embed'))
const TOWN_COUNT = 5

// Server function to fetch restaurants
const getRestaurants = createServerFn({ method: 'GET' }).handler(async () => {
  const restaurants = await withDb(async (db) =>
    await db.orm.public.restaurants
      .where((restaurant) => restaurant.rating.isNotNull())
      .where((restaurant) => restaurant.state.eq('ME'))
      .where((restaurant) => restaurant.longitude.isNotNull())
      .where((restaurant) => restaurant.latitude.isNotNull())
      .select(
        'id',
        'slug',
        'title',
        'description',
        'rating',
        'review_count',
        'city',
        'tags',
        'opening_hours',
        'latitude',
        'longitude',
        'price_level'
      )
      .orderBy([(restaurant) => restaurant.rating.desc(), (restaurant) => restaurant.title.asc()])
      .all(),
  )

  // Parse JSON fields and check if open
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return {
    restaurants: restaurants.map((restaurant) => {
      const opening_hours = restaurant.opening_hours
        ? JSON.parse(restaurant.opening_hours)
        : null

      let isOpen = false
      if (opening_hours) {
        const todaySchedule = opening_hours[currentDay]
        if (
          todaySchedule &&
          !(todaySchedule.open === '00:00' && todaySchedule.close === '00:00')
        ) {
          isOpen =
            currentTime >= todaySchedule.open &&
            currentTime <= todaySchedule.close
        }
      }

      return {
        ...restaurant,
        tags: restaurant.tags ? JSON.parse(restaurant.tags) : [],
        opening_hours,
        isOpen,
      }
    }),
  }
})

type Restaurant = Awaited<ReturnType<typeof getRestaurants>>['restaurants'][number]

export const Route = createFileRoute('/')({
  validateSearch: z.object({
    view: z.enum(['list', 'map']).default('list'),
  }),
  search: {
    middlewares: [stripSearchParams({ view: 'list' })],
  },
  loader: async () => await getRestaurants(),
  component: PlacesIndex,
  shouldReload: (match) => match.cause !== 'stay',
})

function PlacesIndex() {
  const { restaurants } = Route.useLoaderData()
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null)
  const [town, setTown] = useState('all')
  const [openNow, setOpenNow] = useState(false)
  const { view } = Route.useSearch()
  const navigate = useNavigate({ from: '/' })

  const towns = useMemo(() => {
    const counts = new Map<string, number>()
    for (const restaurant of restaurants) {
      if (restaurant.city) {
        counts.set(restaurant.city, (counts.get(restaurant.city) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOWN_COUNT)
      .map(([city]) => city)
  }, [restaurants])

  const townCount = useMemo(
    () => new Set(restaurants.map((restaurant: Restaurant) => restaurant.city).filter(Boolean)).size,
    [restaurants],
  )

  const filtered = restaurants.filter((restaurant: Restaurant) => {
    if (town !== 'all' && restaurant.city !== town) return false
    if (openNow && !restaurant.isOpen) return false
    return true
  })

  const setView = (nextView: 'list' | 'map') => {
    void navigate({
      to: '/',
      search: { view: nextView },
    })
  }

  return (
    <div>
      <div className="sticky top-16 z-20 flex min-h-14 items-center gap-2 border-b border-stone-200 bg-white px-4 sm:px-6">
        {/* Filter location */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="text-stone-300 font-normal">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="text-black font-medium">Seafood</span>
            <span className="text-stone-500 font-normal">4</span>
          </button>
        </div>
        {/* Filter type: cafe, pub, restaurant */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="text-stone-300 font-normal">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="text-black font-medium">Seafood</span>
            <span className="text-stone-500 font-normal">4</span>
          </button>
        </div>
        {/* Filter cuisine */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="text-stone-300 font-normal">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="text-black font-medium">Seafood</span>
            <span className="text-stone-500 font-normal">4</span>
          </button>
        </div>
        {/* Filter price */}
        <div className="flex items-center gap-3 font-instrument">
          <button className={button({ scheme: 'stone', size: 'sm' })}>
            <span className="font-medium">All</span>
            <span className="text-stone-300 font-normal">14</span>
          </button>
          <button className={button({ scheme: 'outline', size: 'sm' })}>
            <span className="text-black font-medium">Seafood</span>
            <span className="text-stone-500 font-normal">4</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col-reverse lg:flex-row lg:items-start">
        <div className="flex flex-col p-6 lg:min-w-0 lg:flex-1">

          <div>
            <h1 className="font-pretrona font-semibold text-5xl mt-2 tracking-tight">Places to eat in Maine</h1>
            <p className="font-instrument text-stone-500 text-lg mt-1">Hand-kept and unsponsored. Drive times are from Portland; hours confirmed within the last week.</p>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 mt-10">
            {filtered.map((restaurant: Restaurant, index: number) => (
              <PlaceListItem
                key={restaurant.id}
                restaurant={restaurant}
                isSelected={selectedRestaurant === restaurant.id}
                index={index}
              />
            ))}
          </ul>
        </div>

        <div className="h-[calc(100dvh-120px)] min-h-0 lg:sticky lg:top-30 lg:min-w-0 lg:flex-1">
          <div className="flex h-full flex-col">
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center bg-white">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
                    <p className="text-ink-soft">Loading map...</p>
                  </div>
                </div>
              }
            >
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
    </div>
  )
}

const PlaceListItem = ({
  restaurant,
  isSelected,
  index,
}: {
  restaurant: Restaurant
  isSelected: boolean
  index: number
}) => {
  return (
    <div className="relative">
      <div className="w-full aspect-3/2 bg-stone-100 rounded-xl relative overflow-hidden">
        <img className="w-full h-full object-cover" src={`https://picsum.photos/1280/720`} />
        {/* <div className="size-full flex items-center justify-center font-pretrona text-6xl text-stone-300">
          {restaurant.title[0]}
        </div> */}
        <div className="absolute top-2 right-2 bg-white shadow-sm shadow-black/10 flex items-center px-2.5 py-1 rounded-full gap-1.5">
          {restaurant.isOpen ? (
            <>
              <span className="size-2 bg-green-800 rounded-full" />
              <span className="font-medium text-xs text-green-800">Open</span>
            </>
          ) : (
            <>
              <span className="size-2 bg-red-800 rounded-full" />
              <span className="font-medium text-xs text-red-800">Closed</span>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 font-instrument">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-instrument font-medium text-lg">
            <Link
              to="/places/$slug"
              params={{ slug: restaurant.slug }}
              preload={false}
              className="before:absolute before:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              {restaurant.title}
            </Link>
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-stone-500 text-sm">
          {restaurant.city && (
            <span>{restaurant.city}</span>
          )}
          {restaurant.tags.length > 0 && (
            <>
              <span aria-hidden>&#x2022;</span>
              <span>{restaurant.tags[0]}</span>
            </>
          )}
          {restaurant.price_level ? (
            <>
              <span aria-hidden>&#x2022;</span>
              <span>
                {restaurant.price_level === 'PRICE_LEVEL_VERY_EXPENSIVE' ? '$$$$'
                  : restaurant.price_level === 'PRICE_LEVEL_EXPENSIVE' ? "$$$"
                    : restaurant.price_level === 'PRICE_LEVEL_MODERATE' ? "$$"
                      : restaurant.price_level === 'PRICE_LEVEL_INEXPENSIVE' ? "$"
                        : null}
              </span>
            </>
          ) : null}
        </div>

        {restaurant.description && (
          <p className="mt-1 line-clamp-2 text-stone-600">
            {restaurant.description}
          </p>
        )}
      </div>
    </div >
  )
}
