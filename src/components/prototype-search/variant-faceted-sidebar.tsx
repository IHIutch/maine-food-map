/**
 * PROTOTYPE — Variant B: "InstantSearch faceted sidebar".
 * Search is a persistent left rail: one query box plus checkbox facet lists
 * with live counts. Results are a dense scannable table, no cards, no map.
 */
import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import type { Facet, Place, Refinements } from './search-core'

import { Marked } from './bits'
import { buildFacets, NO_REFINEMENTS, priceLabel, refine, searchPlaces, toggle } from './search-core'

export const variantName = 'Faceted sidebar'

const RESULT_CAP = 48

type SortKey = 'relevance' | 'rating' | 'name'

function FacetList({ title, items, selected, onToggle }: {
  title: string
  items: Facet[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="border-t border-ink/10 pt-5">
      <p className="mb-2.5 font-mono text-[10px] tracking-[0.16em] text-ink-soft uppercase">{title}</p>
      <ul className="space-y-0.5">
        {items.slice(0, 8).map(item => (
          <li key={item.value}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 hover:bg-cream">
              <input
                type="checkbox"
                checked={selected.includes(item.value)}
                onChange={() => onToggle(item.value)}
                className="size-3.5 accent-accent-deep"
              />
              <span className="flex-1 truncate font-sans text-[13.5px] text-ink">{item.value}</span>
              <span className="rounded-full bg-cream px-1.5 font-mono text-[10px] text-ink-soft">{item.count}</span>
            </label>
          </li>
        ))}
        {items.length === 0 && <li className="px-1.5 font-sans text-[13px] text-ink-soft/60">None in these results</li>}
      </ul>
    </div>
  )
}

export default function VariantFacetedSidebar({ places }: { places: Place[] }) {
  const [query, setQuery] = useState('')
  const [refinements, setRefinements] = useState<Refinements>(NO_REFINEMENTS)
  const [sort, setSort] = useState<SortKey>('relevance')

  const matched = useMemo(() => searchPlaces(places, query), [places, query])
  const facets = useMemo(() => buildFacets(matched), [matched])
  const results = useMemo(() => {
    const refined = refine(matched, refinements)
    if (sort === 'rating')
      return [...refined].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    if (sort === 'name')
      return [...refined].sort((a, b) => a.title.localeCompare(b.title))
    return refined
  }, [matched, refinements, sort])

  const activeCount = refinements.towns.length + refinements.tags.length + refinements.prices.length + (refinements.openNow ? 1 : 0)

  return (
    <div className="flex min-h-[80vh] bg-paper">
      <aside className="w-72 shrink-0 border-r border-ink/10 bg-white px-5 py-6">
        <div className="relative">
          <span className="absolute top-1/2 left-3 icon-[material-symbols--search-rounded] size-4 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-ink/20 bg-paper py-2.5 pr-8 pl-9 font-sans text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer">
              <span className="icon-[material-symbols--close-rounded] size-4 text-ink-soft" />
            </button>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.16em] text-ink-soft uppercase">Refine</p>
          {activeCount > 0 && (
            <button type="button" onClick={() => setRefinements(NO_REFINEMENTS)} className="cursor-pointer font-sans text-[12px] text-accent-deep underline underline-offset-2">
              Clear (
              {activeCount}
              )
            </button>
          )}
        </div>

        <div className="mt-3 space-y-5">
          <div className="border-t border-ink/10 pt-5">
            <label className="flex cursor-pointer items-center gap-2.5 px-1.5">
              <input
                type="checkbox"
                checked={refinements.openNow}
                onChange={() => setRefinements(current => ({ ...current, openNow: !current.openNow }))}
                className="size-3.5 accent-accent-deep"
              />
              <span className="flex-1 font-sans text-[13.5px] text-ink">Open now</span>
              <span className="rounded-full bg-cream px-1.5 font-mono text-[10px] text-ink-soft">{matched.filter(place => place.isOpen).length}</span>
            </label>
          </div>
          <FacetList
            title="Town"
            items={facets.towns}
            selected={refinements.towns}
            onToggle={value => setRefinements(current => ({ ...current, towns: toggle(current.towns, value) }))}
          />
          <FacetList
            title="Cuisine"
            items={facets.tags}
            selected={refinements.tags}
            onToggle={value => setRefinements(current => ({ ...current, tags: toggle(current.tags, value) }))}
          />
          <FacetList
            title="Price"
            items={facets.prices}
            selected={refinements.prices}
            onToggle={value => setRefinements(current => ({ ...current, prices: toggle(current.prices, value) }))}
          />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-6">
        <div className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-4">
          <p className="font-sans text-sm text-ink-soft">
            <span className="font-medium text-ink">{results.length}</span>
            {' '}
            of
            {' '}
            {places.length}
            {' '}
            places
            {query && (
              <span>
                {' '}
                for “
                {query}
                ”
              </span>
            )}
          </p>
          <label className="flex items-center gap-2 font-sans text-[13px] text-ink-soft">
            Sort
            <select
              value={sort}
              onChange={event => setSort(event.target.value as SortKey)}
              className="cursor-pointer rounded-md border border-ink/20 bg-white px-2 py-1 text-ink focus:outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="rating">Rating</option>
              <option value="name">Name A–Z</option>
            </select>
          </label>
        </div>

        <ul className="divide-y divide-ink/10">
          {results.slice(0, RESULT_CAP).map(place => (
            <li key={place.id}>
              <Link to="/places/$slug" params={{ slug: place.slug }} className="grid grid-cols-[1fr_auto] items-start gap-x-6 gap-y-1 py-3.5 hover:bg-cream/50">
                <div className="min-w-0">
                  <p className="font-sans text-[15px] font-medium text-ink">
                    <Marked text={place.title} query={query} />
                  </p>
                  <p className="truncate font-sans text-[13px] text-ink-soft">
                    <Marked text={place.description ?? ''} query={query} />
                  </p>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-wider text-ink-soft uppercase">
                  <span>
                    <Marked text={place.city ?? ''} query={query} />
                  </span>
                  <span>{priceLabel(place.price_level)}</span>
                  <span className="tabular-nums">
                    ★
                    {place.rating?.toFixed(1)}
                  </span>
                  <span className={place.isOpen ? 'text-green-800' : 'text-ink-soft/50'}>{place.isOpen ? 'Open' : 'Closed'}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        {results.length > RESULT_CAP && (
          <p className="py-6 text-center font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">
            Prototype cap — showing first
            {' '}
            {RESULT_CAP}
            {' '}
            of
            {' '}
            {results.length}
          </p>
        )}

        {results.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-display text-xl text-ink">No places match</p>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setRefinements(NO_REFINEMENTS)
              }}
              className="mt-3 cursor-pointer font-sans text-sm text-accent-deep underline underline-offset-4"
            >
              Clear search and filters
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
