import { cn } from 'tailwind-variants'

import { photoTile } from './ui'

export interface Photo {
  url?: string
}

/**
 * The place page's picture grid, shrunk for the map popover and drawer: a hero
 * with up to two thumbs beside it, laid out to fill whatever it's given.
 *
 * The stored Google Places URLs still carry a `key=YOUR_API_KEY` placeholder, so
 * — as elsewhere in the app — these are stand-ins. They're seeded per place so a
 * given card keeps the same pictures between renders.
 */
export default function PlacePhotos({ photos, seed, className }: {
  photos: Photo[] | null | undefined
  seed: string | number
  className?: string
}) {
  const shown = photos?.slice(0, 3) ?? []
  if (shown.length === 0)
    return null

  return (
    <div className={`grid w-full grid-cols-3 grid-rows-2 gap-2 md:grid-cols-1 ${className ?? ''}`}>
      {shown.map((photo, index) => {
        const role = shown.length === 1
          ? 'solo'
          : index === 0
            ? 'hero'
            : shown.length === 2 ? 'column' : 'thumb'

        return (
          <div key={photo.url ?? `${seed}-${index}`} className={photoTile({ role, className: index === 0 ? '' : 'md:hidden' })}>
            <img
              className={cn('size-full object-cover md:aspect-16/9')}
              src={`https://picsum.photos/seed/${seed}-${index}/640/480`}
              alt=""
              loading="lazy"
            />
          </div>
        )
      })}
    </div>
  )
}
