/**
 * Desktop filters use menus with live counts. Mobile filters stage edits in a
 * sheet and apply them when the user selects "Show N places".
 */
import { Menu } from '@ark-ui/react/menu'
import { lazy, Suspense, useEffect, useState } from 'react'

import type { FacetOption, FilterablePlace, PlaceFacets, PlaceFilters } from '../utils/place-filters'

import { activeFilterCount, applyPlaceFilters, NO_FILTERS, toggleValue } from '../utils/place-filters'
import { useMediaQuery } from '../utils/use-media-query'
import PlaceSearchField from './place-search-field'
import { button, eyebrow, filterChip, filterChipCount, filterMenu, filterMenuOption, metaLabel } from './ui'
import ViewToggle from './view-toggle'

const BottomSheet = lazy(() => import('./bottom-sheet'))

/** Enough for the filter maths and for the search field beside it. */
type SearchableFilterablePlace = FilterablePlace & {
  id: number
  slug: string
  title: string
}

const DIMENSIONS = [
  { key: 'city', label: 'Town' },
  { key: 'cuisine', label: 'Cuisine' },
  { key: 'price', label: 'Price' },
] as const

interface FilterProps {
  places: SearchableFilterablePlace[]
  facets: PlaceFacets
  filters: PlaceFilters
  onChange: (next: PlaceFilters) => void
  resultCount: number
  cuisineNames: Record<string, string>
  view: 'list' | 'map'
  onViewChange: (next: 'list' | 'map') => void
}

function ChipCount({ children }: { children: React.ReactNode }) {
  return <span className={filterChipCount()}>{children}</span>
}

function FilterMenu({ label, options, selected, onToggle }: {
  label: string
  options: FacetOption[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    // Ark's Menu brings the WAI-ARIA menu pattern: roving focus, typeahead,
    // Escape-to-trigger, and collision-aware positioning we'd otherwise hand-roll.
    <Menu.Root closeOnSelect={false} positioning={{ placement: 'bottom-start', gutter: 8 }}>
      <Menu.Trigger className={filterChip({ active: selected.length > 0 })}>
        {label}
        {selected.length > 0 && <span className="tabular-nums">{selected.length}</span>}
        <span className="icon-[material-symbols--keyboard-arrow-down-rounded] size-4 opacity-60" />
      </Menu.Trigger>

      <Menu.Positioner>
        <Menu.Content className={filterMenu()}>
          {options.map(option => (
            <Menu.CheckboxItem
              key={option.value}
              value={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => onToggle(option.value)}
              className={filterMenuOption()}
            >
              <Menu.ItemIndicator className="text-blueberry-600">
                <span className="icon-[material-symbols--check-rounded] size-3.5" />
              </Menu.ItemIndicator>
              <Menu.ItemText className="flex-1 truncate font-sans text-[13.5px] text-ink">
                {option.label}
              </Menu.ItemText>
              <ChipCount>{option.count}</ChipCount>
            </Menu.CheckboxItem>
          ))}
          {options.length === 0 && (
            <p className="px-2 py-3 font-sans text-[13px] text-stone-500">Nothing left to narrow.</p>
          )}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  )
}

function FilterBar({ places, facets, filters, onChange, resultCount, cuisineNames }: FilterProps) {
  const active = activeFilterCount(filters)

  return (
    <div className="flex min-h-14 flex-wrap items-center gap-2 px-4 sm:px-6">
      <PlaceSearchField places={places} filters={filters} onChange={onChange} cuisineNames={cuisineNames} />
      <span className="mx-1 h-6 w-px bg-stone-200" aria-hidden />
      {DIMENSIONS.map(dimension => (
        <FilterMenu
          key={dimension.key}
          label={dimension.label}
          options={facets[dimension.key]}
          selected={filters[dimension.key]}
          onToggle={value => onChange({ ...filters, [dimension.key]: toggleValue(filters[dimension.key], value) })}
        />
      ))}

      <button
        type="button"
        onClick={() => onChange({ ...filters, openNow: !filters.openNow })}
        className={filterChip({ active: filters.openNow })}
      >
        Open now
        <ChipCount>{facets.openNow}</ChipCount>
      </button>

      <span className={metaLabel({ className: 'ml-auto text-stone-500' })}>
        {resultCount}
        {' '}
        {resultCount === 1 ? 'place' : 'places'}
      </span>

      {active > 0 && (
        <button
          type="button"
          onClick={() => onChange(NO_FILTERS)}
          className="cursor-pointer font-sans text-[13px] text-blueberry-600 underline underline-offset-4"
        >
          Clear
        </button>
      )}
    </div>
  )
}

function SheetGroup({ title, options, selected, onToggle }: {
  title: string
  options: FacetOption[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  if (options.length === 0)
    return null

  return (
    <div className="border-t border-ink/10 pt-4">
      <p className={eyebrow({ className: 'mb-2.5' })}>{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.slice(0, 12).map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
            className={filterChip({ active: selected.includes(option.value) })}
          >
            {option.label}
            <ChipCount>{option.count}</ChipCount>
          </button>
        ))}
      </div>
    </div>
  )
}

function FilterSheetTrigger({ places, facets, filters, onChange, resultCount, view, onViewChange }: FilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const active = activeFilterCount(filters)

  // opening always starts from what's actually applied
  useEffect(() => {
    if (isOpen)
      setDraft(filters)
  }, [isOpen, filters])

  const draftCount = applyPlaceFilters(places, draft).length

  return (
    <>
      <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={button({ scheme: active > 0 ? 'stone' : 'outline', size: 'sm' })}
        >
          <span className="icon-[material-symbols--tune-rounded] size-4" />
          Filters
          {active > 0 && <span className="tabular-nums">{active}</span>}
        </button>

        <span className={metaLabel({ className: 'text-stone-500' })}>
          {resultCount}
          {' '}
          {resultCount === 1 ? 'place' : 'places'}
        </span>

        {active > 0 && (
          <button
            type="button"
            onClick={() => onChange(NO_FILTERS)}
            className="cursor-pointer font-sans text-[13px] text-stone-600 underline underline-offset-4"
          >
            Clear
          </button>
        )}

        <div className="ml-auto">
          <ViewToggle view={view} onChange={onViewChange} />
        </div>
      </div>

      <Suspense fallback={null}>
        <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen} label="Filters" size="auto">
          <div className="flex max-h-[75svh] flex-col">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4">
              <div className="flex items-center justify-between pt-1">
                <p className="font-display text-2xl font-medium text-ink">Filters</p>
                <button
                  type="button"
                  onClick={() => setDraft(NO_FILTERS)}
                  className="cursor-pointer font-sans text-[13px] text-blueberry-600 underline underline-offset-4"
                >
                  Reset
                </button>
              </div>

              <div className="border-t border-ink/10 pt-4">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, openNow: !draft.openNow })}
                  className={filterChip({ active: draft.openNow })}
                >
                  Open now
                  <ChipCount>{facets.openNow}</ChipCount>
                </button>
              </div>

              <SheetGroup title="Price" options={facets.price} selected={draft.price} onToggle={value => setDraft({ ...draft, price: toggleValue(draft.price, value) })} />
              <SheetGroup title="Cuisine" options={facets.cuisine} selected={draft.cuisine} onToggle={value => setDraft({ ...draft, cuisine: toggleValue(draft.cuisine, value) })} />
              <SheetGroup title="Town" options={facets.city} selected={draft.city} onToggle={value => setDraft({ ...draft, city: toggleValue(draft.city, value) })} />
            </div>

            <div className="border-t border-ink/10 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => {
                  onChange(draft)
                  setIsOpen(false)
                }}
                className={button({ scheme: 'stone', size: 'lg', className: 'w-full' })}
              >
                Show
                {' '}
                {draftCount}
                {' '}
                {draftCount === 1 ? 'place' : 'places'}
              </button>
            </div>
          </div>
        </BottomSheet>
      </Suspense>
    </>
  )
}

export default function PlaceFiltersControl(props: FilterProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)')

  return (
    <div className="sticky top-16 z-20 border-b border-stone-200 bg-white">
      {isDesktop ? <FilterBar {...props} /> : <FilterSheetTrigger {...props} />}
    </div>
  )
}
