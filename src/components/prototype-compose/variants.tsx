/**
 * PROTOTYPE — three ways search and filtering can share one page.
 *
 *   A  the bar filters, search writes into it, typed words are lost
 *   B  one refinement set: typed words become a token, search is scoped
 *   C  no bar at all — the search input holds every refinement as a token
 */
import type { FacetOption, PlaceFacets, PlaceFilters } from '../../utils/place-filters'
import type { ComposePolicy } from './compose-core'

import { activeFilterCount, NO_FILTERS } from '../../utils/place-filters'
import { eyebrow, filterChip, filterChipCount, metaLabel } from '../ui'
import { setDimension } from './compose-core'
import ComposeSearch from './compose-search'

interface Place {
  id: number
  title: string
  slug: string
  city?: string | null
  townSlug: string | null
  cuisineSlugs: string[]
  isOpen: boolean
}

export interface VariantProps {
  policy: ComposePolicy
  allPlaces: Place[]
  scopedPlaces: Place[]
  facets: PlaceFacets
  filters: PlaceFilters
  term: string
  onFilters: (next: PlaceFilters) => void
  onTerm: (next: string) => void
  cuisineNames: Record<string, string>
}

function Chips({ options, selected, onToggle }: { options: FacetOption[], selected: string[], onToggle: (value: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.slice(0, 6).map(option => (
        <button key={option.value} type="button" onClick={() => onToggle(option.value)} className={filterChip({ active: selected.includes(option.value) })}>
          {option.label}
          <span className={filterChipCount()}>{option.count}</span>
        </button>
      ))}
    </div>
  )
}

function TokenRow({ filters, term, cuisineNames, facets, onFilters, onTerm }: VariantProps) {
  const tokens = [
    ...(term ? [{ key: 'term', kind: 'text', label: `“${term}”`, drop: () => onTerm('') }] : []),
    ...filters.city.map(value => ({
      key: `city-${value}`,
      kind: 'in',
      label: facets.city.find(option => option.value === value)?.label ?? value,
      drop: () => onFilters({ ...filters, city: filters.city.filter(item => item !== value) }),
    })),
    ...filters.cuisine.map(value => ({
      key: `cuisine-${value}`,
      kind: 'is',
      label: cuisineNames[value] ?? value,
      drop: () => onFilters({ ...filters, cuisine: filters.cuisine.filter(item => item !== value) }),
    })),
    ...(filters.openNow ? [{ key: 'open', kind: 'when', label: 'Open now', drop: () => onFilters({ ...filters, openNow: false }) }] : []),
  ]

  if (tokens.length === 0)
    return <span className="text-ink-soft font-sans text-[13px]">Nothing applied yet.</span>

  return (
    <>
      {tokens.map(token => (
        <span key={token.key} className="bg-accent/20 inline-flex h-8 items-center gap-1.5 rounded-lg pr-1.5 pl-2.5 font-sans text-[13px] text-ink">
          <span className="text-accent-deep font-mono text-[10px] tracking-wider uppercase">{token.kind}</span>
          {token.label}
          <button type="button" onClick={token.drop} className="cursor-pointer" aria-label={`Remove ${token.label}`}>
            <span className="icon-[material-symbols--close-rounded] size-3.5 opacity-60" />
          </button>
        </span>
      ))}
    </>
  )
}

/** A + B share a bar; only the policy differs, which is the point of the comparison. */
export function VariantWithBar(props: VariantProps) {
  const { facets, filters, onFilters, policy, scopedPlaces, term, onTerm } = props
  const active = activeFilterCount(filters) + (term ? 1 : 0)

  return (
    <div className="border-b border-stone-200 bg-white px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <ComposeSearch {...props} autoFocus={false} />

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className={eyebrow({ className: 'mb-1.5' })}>Cuisine</p>
            <Chips options={facets.cuisine} selected={filters.cuisine} onToggle={value => onFilters(setDimension(filters, 'cuisine', value, policy))} />
          </div>
          <div>
            <p className={eyebrow({ className: 'mb-1.5' })}>Town</p>
            <Chips options={facets.city} selected={filters.city} onToggle={value => onFilters(setDimension(filters, 'city', value, policy))} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
        <span className={metaLabel({ className: 'text-ink-soft' })}>
          {scopedPlaces.length}
          {' '}
          places
        </span>
        <TokenRow {...props} />
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              onFilters(NO_FILTERS)
              onTerm('')
            }}
            className="text-accent-deep cursor-pointer font-sans text-[13px] underline underline-offset-4"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

/** C — the search input is the only control on the page. */
export function VariantSearchOnly(props: VariantProps) {
  const { scopedPlaces, filters, onFilters, onTerm, term } = props
  const active = activeFilterCount(filters) + (term ? 1 : 0)

  return (
    <div className="border-b border-stone-200 bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <ComposeSearch {...props} autoFocus />
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={metaLabel({ className: 'text-ink-soft' })}>
            {scopedPlaces.length}
            {' '}
            places
          </span>
          <TokenRow {...props} />
          {active > 0 && (
            <button
              type="button"
              onClick={() => {
                onFilters(NO_FILTERS)
                onTerm('')
              }}
              className="text-accent-deep cursor-pointer font-sans text-[13px] underline underline-offset-4"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
