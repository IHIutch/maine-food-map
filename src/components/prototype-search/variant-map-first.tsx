/**
 * PROTOTYPE — Variant D: "Map-first search".
 * Full-bleed map owns the screen; search is a floating capsule over it and
 * results live in a horizontally-scrolling rail docked to the bottom.
 * Hovering a result selects its marker.
 */
import { Link } from '@tanstack/react-router'
import { lazy, Suspense, useMemo, useState } from 'react'

import type { Place, Refinements } from './search-core'

import { Marked } from './bits'
import { buildFacets, NO_REFINEMENTS, priceLabel, refine, searchPlaces, toggle } from './search-core'

const MapboxEmbed = lazy(() => import('../mapbox-embed'))

export const variantName = 'Map-first search'

const RESULT_CAP = 30

export default function VariantMapFirst({ places }: { places: Place[] }) {
  const [query, setQuery] = useState('')
  const [refinements, setRefinements] = useState<Refinements>(NO_REFINEMENTS)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const facets = useMemo(() => buildFacets(places), [places])
  const results = useMemo(() => refine(searchPlaces(places, query), refinements), [places, query, refinements])

  return (
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-cream">
      <Suspense fallback={<div className="grid h-full place-items-center font-mono text-xs tracking-widest text-ink-soft uppercase">Loading map…</div>}>
        <MapboxEmbed
          places={results.map(place => ({ ...place, longitude: place.longitude ?? null, latitude: place.latitude ?? null }))}
          selectedId={selectedId}
          onMarkerClick={setSelectedId}
          isShowing
        />
      </Suspense>

      {/* Floating search capsule */}
      <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center px-4">
        <div className="pointer-events-auto w-full max-w-2xl">
          <div className="flex items-center gap-2 rounded-full bg-paper/95 px-4 py-2.5 shadow-xl ring-1 ring-ink/10 backdrop-blur">
            <span className="icon-[material-symbols--search-rounded] size-5 text-ink-soft" />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search this area — name, town, cuisine"
              className="min-w-0 flex-1 bg-transparent font-sans text-[15px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
            />
            <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 font-mono text-[11px] text-paper tabular-nums">{results.length}</span>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setRefinements(current => ({ ...current, openNow: !current.openNow }))}
              className={`cursor-pointer rounded-full px-3 py-1.5 font-sans text-[13px] shadow-md ring-1 ring-ink/10 ${refinements.openNow ? 'bg-ink text-paper' : 'bg-paper/95 text-ink'}`}
            >
              Open now
            </button>
            {facets.tags.slice(0, 5).map(facet => (
              <button
                key={facet.value}
                type="button"
                onClick={() => setRefinements(current => ({ ...current, tags: toggle(current.tags, facet.value) }))}
                className={`cursor-pointer rounded-full px-3 py-1.5 font-sans text-[13px] shadow-md ring-1 ring-ink/10 ${refinements.tags.includes(facet.value) ? 'bg-ink text-paper' : 'bg-paper/95 text-ink'}`}
              >
                {facet.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom result rail */}
      <div className="absolute inset-x-0 bottom-0 z-20">
        <div className="flex gap-3 overflow-x-auto px-4 pt-6 pb-5 [scrollbar-width:none]">
          {results.slice(0, RESULT_CAP).map(place => (
            <div
              key={place.id}
              onMouseEnter={() => setSelectedId(place.id)}
              className={`relative w-64 shrink-0 rounded-xl bg-paper p-3.5 shadow-xl ring-1 transition-transform ${selectedId === place.id ? '-translate-y-1 ring-accent-deep' : 'ring-ink/10'}`}
            >
              <p className="font-display text-[17px] leading-tight text-ink">
                <Link to="/places/$slug" params={{ slug: place.slug }} className="before:absolute before:inset-0">
                  <Marked text={place.title} query={query} />
                </Link>
              </p>
              <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-ink-soft uppercase">
                {place.city}
                {priceLabel(place.price_level) ? ` · ${priceLabel(place.price_level)}` : ''}
                {' · '}
                <span className={place.isOpen ? 'text-green-800' : 'text-ink-soft/60'}>{place.isOpen ? 'Open' : 'Closed'}</span>
              </p>
              <p className="mt-1.5 line-clamp-2 font-sans text-[13px] text-ink-soft">{place.description}</p>
            </div>
          ))}
          {results.length === 0 && (
            <div className="w-full rounded-xl bg-paper p-5 text-center font-sans text-sm text-ink-soft shadow-xl ring-1 ring-ink/10">
              No places match — try clearing a filter.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
