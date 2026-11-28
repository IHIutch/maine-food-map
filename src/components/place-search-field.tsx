/**
 * Searches all places from the filter bar. Selecting a town or cuisine changes
 * that filter and preserves the others. Typing alone does not change the page.
 * The command palette provides search on small screens.
 *
 * Ark's Combobox handles roles, keyboard navigation, and popup positioning.
 */
import { createListCollection } from '@ark-ui/react/collection'
import { Combobox } from '@ark-ui/react/combobox'
import { Highlight } from '@ark-ui/react/highlight'
import { useNavigate } from '@tanstack/react-router'
import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'

import type { PlaceFilters } from '../utils/place-filters'

import { eyebrow, paletteRow, paletteRowHint, paletteRowMeta, searchField, searchMark } from './ui'

interface SearchablePlace {
  id: number
  slug: string
  title: string
  city?: string | null
  townSlug: string | null
  cuisineSlugs: string[]
}

interface Suggestion {
  /** Combobox item value, `place:slug`, `town:value` or `cuisine:value`. */
  value: string
  kind: 'place' | 'town' | 'cuisine'
  label: string
  meta: string
}

const GROUP_LABELS = { place: 'Places', town: 'Towns', cuisine: 'Cuisines' } as const
const PLACE_LIMIT = 4
const FACET_LIMIT = 3

export default function PlaceSearchField({ places, filters, onChange, cuisineNames }: {
  places: SearchablePlace[]
  filters: PlaceFilters
  onChange: (next: PlaceFilters) => void
  cuisineNames: Record<string, string>
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const searcher = useMemo(() => new Fuse(places, {
    keys: [{ name: 'title', weight: 0.7 }, { name: 'city', weight: 0.3 }],
    threshold: 0.34,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [places])

  const suggestions = useMemo<Suggestion[]>(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2)
      return []

    const placeRows = searcher.search(query).slice(0, PLACE_LIMIT).map<Suggestion>(result => ({
      value: `place:${result.item.slug}`,
      kind: 'place',
      label: result.item.title,
      meta: result.item.city ?? '',
    }))

    const towns = new Map<string, { label: string, count: number }>()
    const cuisines = new Map<string, { label: string, count: number }>()
    for (const place of places) {
      if (place.townSlug && (place.city ?? '').toLowerCase().includes(needle)) {
        const entry = towns.get(place.townSlug) ?? { label: place.city ?? place.townSlug, count: 0 }
        towns.set(place.townSlug, { label: entry.label, count: entry.count + 1 })
      }
      for (const slug of place.cuisineSlugs) {
        const label = cuisineNames[slug] ?? slug
        if (!label.toLowerCase().includes(needle))
          continue
        const entry = cuisines.get(slug) ?? { label, count: 0 }
        cuisines.set(slug, { label, count: entry.count + 1 })
      }
    }

    const byCount = (a: [string, { count: number }], b: [string, { count: number }]) => b[1].count - a[1].count
    const facetRows = (map: Map<string, { label: string, count: number }>, kind: 'town' | 'cuisine') =>
      [...map].sort(byCount).slice(0, FACET_LIMIT).map<Suggestion>(([value, entry]) => ({
        value: `${kind}:${value}`,
        kind,
        label: entry.label,
        meta: `${entry.count} places`,
      }))

    return [...placeRows, ...facetRows(towns, 'town'), ...facetRows(cuisines, 'cuisine')]
  }, [query, searcher, places, cuisineNames])

  const collection = useMemo(() => createListCollection({
    items: suggestions,
    itemToValue: item => item.value,
    itemToString: item => item.label,
    groupBy: item => item.kind,
  }), [suggestions])

  function choose(value: string) {
    const [kind, id] = value.split(':')
    setQuery('')
    if (kind === 'place') {
      navigate({ to: '/places/$slug', params: { slug: id! } })
      return
    }
    onChange({ ...filters, [kind === 'town' ? 'city' : 'cuisine']: [id!] })
  }

  return (
    <Combobox.Root
      collection={collection}
      inputValue={query}
      onInputValueChange={details => setQuery(details.inputValue)}
      onValueChange={details => details.value[0] && choose(details.value[0])}
      // Clear the query after a selection.
      selectionBehavior="clear"
      openOnClick={false}
      className="relative w-full max-w-72"
    >
      <Combobox.Control className="flex h-9 items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5">
        <span className="icon-[material-symbols--search-rounded] size-4 shrink-0 text-stone-500" />
        <Combobox.Input
          placeholder="Search places…"
          aria-label="Search places, towns and cuisines"
          className={searchField({ className: 'py-0 text-[13px]' })}
        />
        {query && (
          <Combobox.ClearTrigger className="shrink-0 cursor-pointer" aria-label="Clear search">
            <span className="icon-[material-symbols--close-rounded] size-4 text-stone-500" />
          </Combobox.ClearTrigger>
        )}
      </Combobox.Control>

      <Combobox.Positioner>
        <Combobox.Content className="w-80 overflow-hidden rounded-xl border border-stone-200 bg-white p-2 shadow-xl">
          {collection.group().map(([kind, items]) => (
            <Combobox.ItemGroup key={kind}>
              <Combobox.ItemGroupLabel className={eyebrow({ className: 'px-3 pt-2 pb-1 text-stone-500' })}>
                {GROUP_LABELS[kind as Suggestion['kind']]}
              </Combobox.ItemGroupLabel>
              {items.map(item => (
                <Combobox.Item key={item.value} item={item} className={paletteRow({ className: 'py-2 data-highlighted:bg-ink data-highlighted:text-white [&[data-highlighted]_*]:text-white' })}>
                  <span className={`size-4 shrink-0 opacity-60 ${
                    item.kind === 'place'
                      ? 'icon-[material-symbols--restaurant-rounded]'
                      : item.kind === 'town'
                        ? 'icon-[material-symbols--location-on-rounded]'
                        : 'icon-[material-symbols--label-rounded]'
                  }`}
                  />
                  <Combobox.ItemText className="min-w-0 flex-1 truncate font-sans text-[14px]">
                    <Highlight text={item.label} query={query} ignoreCase matchAll className={searchMark()} />
                    <span className={paletteRowMeta({ className: 'ml-2' })}>{item.meta}</span>
                  </Combobox.ItemText>
                  {item.kind !== 'place' && <span className={paletteRowHint()}>Filter</span>}
                </Combobox.Item>
              ))}
            </Combobox.ItemGroup>
          ))}
        </Combobox.Content>
      </Combobox.Positioner>
    </Combobox.Root>
  )
}
