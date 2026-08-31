/**
 * PROTOTYPE — the search box used by the composition variants. It lives on the
 * page (not in the nav) so search and filters can be watched side by side, and
 * it takes its behaviour from the policy: scoped or global, union or replace,
 * typed words kept or dropped.
 */
import { useMemo, useState } from 'react'

import type { PlaceFilters } from '../../utils/place-filters'
import type { ComposePolicy } from './compose-core'

import { eyebrow, paletteRow, paletteRowHint, paletteRowMeta, searchField, searchMark } from '../ui'
import { matchesTerm, setDimension } from './compose-core'

interface Place {
  id: number
  title: string
  slug: string
  city?: string | null
  townSlug: string | null
  cuisineSlugs: string[]
  isOpen: boolean
}

type Suggestion
  = | { kind: 'place', key: string, place: Place }
    | { kind: 'town', key: string, value: string, label: string, count: number }
    | { kind: 'cuisine', key: string, value: string, label: string, count: number }
    | { kind: 'term', key: string, text: string, count: number }

function Marked({ text, term }: { text: string, term: string }) {
  const needle = term.trim()
  if (!needle)
    return <>{text}</>
  const index = text.toLowerCase().indexOf(needle.toLowerCase())
  if (index === -1)
    return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark className={searchMark()}>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}

export default function ComposeSearch({ policy, allPlaces, scopedPlaces, filters, onFilters, onTerm, cuisineNames, autoFocus }: {
  policy: ComposePolicy
  allPlaces: Place[]
  scopedPlaces: Place[]
  filters: PlaceFilters
  onFilters: (next: PlaceFilters) => void
  onTerm: (next: string) => void
  cuisineNames: Record<string, string>
  autoFocus?: boolean
}) {
  const [typed, setTyped] = useState('')
  const pool = policy.scopeToFilters ? scopedPlaces : allPlaces

  const suggestions = useMemo<Suggestion[]>(() => {
    const query = typed.trim()
    if (!query)
      return []

    const places = pool
      .filter(place => matchesTerm([place.title, place.city ?? ''].join(' '), query))
      .slice(0, 4)
      .map<Suggestion>(place => ({ kind: 'place', key: `place-${place.id}`, place }))

    const towns = new Map<string, { label: string, count: number }>()
    const cuisines = new Map<string, { label: string, count: number }>()
    for (const place of pool) {
      if (place.townSlug && matchesTerm(place.city ?? '', query)) {
        const entry = towns.get(place.townSlug) ?? { label: place.city ?? place.townSlug, count: 0 }
        towns.set(place.townSlug, { ...entry, count: entry.count + 1 })
      }
      for (const slug of place.cuisineSlugs) {
        const label = cuisineNames[slug] ?? slug
        if (!matchesTerm(label, query))
          continue
        const entry = cuisines.get(slug) ?? { label, count: 0 }
        cuisines.set(slug, { ...entry, count: entry.count + 1 })
      }
    }

    const facetRows: Suggestion[] = [
      ...[...towns].slice(0, 2).map<Suggestion>(([value, entry]) => ({ kind: 'town', key: `town-${value}`, value, label: entry.label, count: entry.count })),
      ...[...cuisines].slice(0, 3).map<Suggestion>(([value, entry]) => ({ kind: 'cuisine', key: `cuisine-${value}`, value, label: entry.label, count: entry.count })),
    ]

    const termRow: Suggestion[] = policy.keepTypedTerm
      ? [{
          kind: 'term',
          key: 'term',
          text: query,
          count: pool.filter(place => matchesTerm([place.title, place.city ?? '', place.cuisineSlugs.join(' ')].join(' '), query)).length,
        }]
      : []

    return [...termRow, ...facetRows, ...places]
  }, [typed, pool, cuisineNames, policy.keepTypedTerm])

  function choose(suggestion: Suggestion) {
    setTyped('')
    if (suggestion.kind === 'town')
      onFilters(setDimension(filters, 'city', suggestion.value, policy))
    if (suggestion.kind === 'cuisine')
      onFilters(setDimension(filters, 'cuisine', suggestion.value, policy))
    if (suggestion.kind === 'term')
      onTerm(suggestion.text)
    if (suggestion.kind === 'place') {
      console.warn(`PROTOTYPE — would open /places/${suggestion.place.slug}`)
    }
  }

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-xl border border-ink/15 bg-white px-3">
        <span className="text-ink-soft icon-[material-symbols--search-rounded] size-5 shrink-0" />
        <input
          value={typed}
          autoFocus={autoFocus}
          onChange={event => setTyped(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && suggestions[0])
              choose(suggestions[0])
          }}
          placeholder="Place, town or cuisine…"
          className={searchField({ className: 'py-2.5 text-[15px]' })}
        />
        <span className="text-ink-soft shrink-0 font-mono text-[10px] tracking-wider uppercase">
          {policy.scopeToFilters ? `in ${scopedPlaces.length}` : `all ${allPlaces.length}`}
        </span>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-paper absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-ink/10 p-2 shadow-xl">
          {suggestions.map((suggestion) => {
            const heading = suggestion.kind === 'term'
              ? 'Search for these words'
              : suggestion.kind === 'place' ? 'Places' : 'Refine'
            const previous = suggestions[suggestions.indexOf(suggestion) - 1]
            const showHeading = !previous || previous.kind !== suggestion.kind
            return (
              <div key={suggestion.key}>
                {showHeading && <p className={eyebrow({ className: 'px-3 pt-2 pb-1' })}>{heading}</p>}
                <button type="button" onClick={() => choose(suggestion)} className={paletteRow()}>
                  {suggestion.kind === 'place' && (
                    <>
                      <span className="icon-[material-symbols--restaurant-rounded] size-4 opacity-60" />
                      <span className="flex-1 truncate font-sans text-[15px]">
                        <Marked text={suggestion.place.title} term={typed} />
                        <span className={paletteRowMeta({ className: 'ml-2' })}>{suggestion.place.city}</span>
                      </span>
                    </>
                  )}
                  {(suggestion.kind === 'town' || suggestion.kind === 'cuisine') && (
                    <>
                      <span className={`size-4 opacity-60 ${suggestion.kind === 'town' ? 'icon-[material-symbols--location-on-rounded]' : 'icon-[material-symbols--label-rounded]'}`} />
                      <span className="flex-1 truncate font-sans text-[15px]">
                        <Marked text={suggestion.label} term={typed} />
                        <span className={paletteRowMeta({ className: 'ml-2' })}>
                          {suggestion.count}
                          {' '}
                          places
                        </span>
                      </span>
                      <span className={paletteRowHint()}>{filters[suggestion.kind === 'town' ? 'city' : 'cuisine'].length > 0 && !policy.unionWithinDimension ? 'Replaces' : 'Adds'}</span>
                    </>
                  )}
                  {suggestion.kind === 'term' && (
                    <>
                      <span className="icon-[material-symbols--format-quote-rounded] size-4 opacity-60" />
                      <span className="flex-1 truncate font-sans text-[15px]">
                        “
                        {suggestion.text}
                        ”
                        <span className={paletteRowMeta({ className: 'ml-2' })}>
                          {suggestion.count}
                          {' '}
                          places
                        </span>
                      </span>
                      <span className={paletteRowHint()}>Keep as filter</span>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!policy.keepTypedTerm && typed.trim().length > 0 && (
        <p className="text-accent-deep absolute -bottom-6 left-1 font-mono text-[10px] tracking-wider uppercase">
          These words vanish unless you pick something
        </p>
      )}
    </div>
  )
}
