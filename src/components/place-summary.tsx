import { Link } from '@tanstack/react-router'

import type { Photo } from './place-photos'

import PlacePhotos from './place-photos'
import { button, placeSummary, tag } from './ui'

export interface SummaryPlace {
  id: number
  slug: string
  title: string
  description?: string | null
  rating?: number | null
  review_count?: number | null
  city?: string | null
  tags: string[]
  price_level?: string | null
  photos?: Photo[]
  isOpen: boolean
}

export default function PlaceSummary({ place, density = 'roomy' }: {
  place: SummaryPlace
  density?: 'compact' | 'roomy'
  onClose?: () => void
}) {
  const styles = placeSummary({ density })

  return (
    <div className={styles.root({ className: 'rounded-xl bg-white' })}>
      <div className="px-2 md:px-0">
        <PlacePhotos photos={place.photos} seed={place.id} className="h-64 md:h-auto" />
      </div>

      <div className="mt-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className={styles.title()}>
            {place.title}
          </h2>
          <span className={tag({ tone: 'status', isOpen: place.isOpen, className: 'shrink-0' })}>
            {place.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-stone-500">
          {place.city && (
            <span>{place.city}</span>
          )}
          {place.price_level
            ? (
                <>
                  <span aria-hidden>&#x2022;</span>
                  <span>
                    {place.price_level === 'PRICE_LEVEL_VERY_EXPENSIVE'
                      ? '$$$$'
                      : place.price_level === 'PRICE_LEVEL_EXPENSIVE'
                        ? '$$$'
                        : place.price_level === 'PRICE_LEVEL_MODERATE'
                          ? '$$'
                          : place.price_level === 'PRICE_LEVEL_INEXPENSIVE'
                            ? '$'
                            : null}
                  </span>
                </>
              )
            : null}
        </div>
        {place.description && <p className={styles.blurb()}>{place.description}</p>}
      </div>
      <div className="mt-6 px-4 md:mt-4 md:pb-4">
        <Link
          to="/places/$slug"
          params={{ slug: place.slug }}
          preload={false}
          className={button({ scheme: 'stone', size: 'lg', className: 'w-full' })}
        >
          View Place
        </Link>
      </div>
    </div>
  )
}
