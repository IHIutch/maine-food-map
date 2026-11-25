import { Link } from '@tanstack/react-router'

import type { RestaurantSchema } from '../utils/zod/restaurant-schema'

import { tag } from './ui'

export default function PlaceCard({
  restaurant,
}: {
  restaurant: Pick<RestaurantSchema, 'slug' | 'title' | 'city' | 'tags' | 'price_level' | 'description'> & {
    isOpen: boolean
  }
}) {
  return (
    <div className="relative">
      <div className="relative aspect-3/2 w-full overflow-hidden rounded-xl bg-stone-100">
        <div aria-hidden="true" className="flex size-full items-center justify-center font-pretrona text-6xl text-stone-300">
          {restaurant.title[0]}
        </div>
        <span className={tag({ tone: 'status', isOpen: restaurant.isOpen, onImage: true, className: 'absolute top-2 right-2' })}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>
      <div className="mt-2 font-instrument">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-instrument text-lg font-medium">
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
        <div className="flex items-center gap-1.5 text-sm text-stone-500">
          {restaurant.city && (
            <span>{restaurant.city}</span>
          )}
          {(restaurant?.tags && restaurant.tags.length > 0)
            ? (
                <>
                  <span aria-hidden>&#x2022;</span>
                  <span>{restaurant.tags[0]}</span>
                </>
              )
            : null}
          {restaurant.price_level
            ? (
                <>
                  <span aria-hidden>&#x2022;</span>
                  <span>
                    {restaurant.price_level === 'PRICE_LEVEL_VERY_EXPENSIVE'
                      ? '$$$$'
                      : restaurant.price_level === 'PRICE_LEVEL_EXPENSIVE'
                        ? '$$$'
                        : restaurant.price_level === 'PRICE_LEVEL_MODERATE'
                          ? '$$'
                          : restaurant.price_level === 'PRICE_LEVEL_INEXPENSIVE'
                            ? '$'
                            : null}
                  </span>
                </>
              )
            : null}
        </div>

        {restaurant.description && (
          <p className="mt-1 line-clamp-2 text-stone-600">
            {restaurant.description}
          </p>
        )}
      </div>
    </div>
  )
}
