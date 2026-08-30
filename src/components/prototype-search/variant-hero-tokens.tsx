/**
 * PROTOTYPE — Variant C: "Search-first hero with query tokens".
 * The whole page is the search box. Suggestions collapse into chips *inside*
 * the input (town / cuisine / price / open-now), free text keeps typing after
 * them. Results reflow underneath as an editorial grid.
 */
import { Link } from '@tanstack/react-router'
import { useMemo, useRef, useState } from 'react'

import type { Place, Refinements } from './search-core'

import { Marked } from './bits'
import { buildFacets, NO_REFINEMENTS, priceLabel, refine, searchPlaces, toggle, tokenize } from './search-core'

export const variantName = 'Hero token search'

const RESULT_CAP = 48

interface Suggestion { kind: 'town' | 'tag' | 'price' | 'open', value: string, count: number }

export default function VariantHeroTokens({ places }: { places: Place[] }) {
  const [query, setQuery] = useState('')
  const [refinements, setRefinements] = useState<Refinements>(NO_REFINEMENTS)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const facets = useMemo(() => buildFacets(places), [places])
  const results = useMemo(() => refine(searchPlaces(places, query), refinements), [places, query, refinements])

  const suggestions = useMemo<Suggestion[]>(() => {
    const tokens = tokenize(query)
    const hit = (value: string) => tokens.length === 0 || tokens.some(token => value.toLowerCase().includes(token))
    const all: Suggestion[] = [
      ...facets.towns.filter(f => !refinements.towns.includes(f.value)).map(f => ({ kind: 'town' as const, value: f.value, count: f.count })),
      ...facets.tags.filter(f => !refinements.tags.includes(f.value)).map(f => ({ kind: 'tag' as const, value: f.value, count: f.count })),
      ...facets.prices.filter(f => !refinements.prices.includes(f.value)).map(f => ({ kind: 'price' as const, value: f.value, count: f.count })),
      ...(refinements.openNow ? [] : [{ kind: 'open' as const, value: 'Open now', count: places.filter(p => p.isOpen).length }]),
    ]
    return all.filter(item => hit(item.value)).slice(0, 6)
  }, [facets, query, refinements, places])

  function addToken(suggestion: Suggestion) {
    setRefinements((current) => {
      if (suggestion.kind === 'town')
        return { ...current, towns: toggle(current.towns, suggestion.value) }
      if (suggestion.kind === 'tag')
        return { ...current, tags: toggle(current.tags, suggestion.value) }
      if (suggestion.kind === 'price')
        return { ...current, prices: toggle(current.prices, suggestion.value) }
      return { ...current, openNow: true }
    })
    setQuery('')
    inputRef.current?.focus()
  }

  const tokens: { label: string, kind: string, drop: () => void }[] = [
    ...refinements.towns.map(value => ({ label: value, kind: 'in', drop: () => setRefinements(c => ({ ...c, towns: toggle(c.towns, value) })) })),
    ...refinements.tags.map(value => ({ label: value, kind: 'is', drop: () => setRefinements(c => ({ ...c, tags: toggle(c.tags, value) })) })),
    ...refinements.prices.map(value => ({ label: value, kind: 'price', drop: () => setRefinements(c => ({ ...c, prices: toggle(c.prices, value) })) })),
    ...(refinements.openNow ? [{ label: 'now', kind: 'open', drop: () => setRefinements(c => ({ ...c, openNow: false })) }] : []),
  ]

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Backspace' && query === '' && tokens.length > 0)
      tokens[tokens.length - 1]!.drop()
    if (event.key === 'Enter' && suggestions[0])
      addToken(suggestions[0])
  }

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-cream to-paper">
      <div className="mx-auto max-w-4xl px-6 pt-16 pb-10 text-center">
        <p className="font-mono text-[11px] tracking-[0.16em] text-ink-soft uppercase">
          {places.length}
          {' '}
          hand-kept places · hours checked weekly
        </p>
        <h1 className="mt-4 font-display text-6xl leading-[0.95] font-medium tracking-tight text-ink">
          What are you
          {' '}
          <span className="italic">hungry</span>
          {' '}
          for?
        </h1>

        <div className="relative mx-auto mt-9 max-w-2xl">
          <div
            onClick={() => inputRef.current?.focus()}
            className="flex cursor-text flex-wrap items-center gap-2 rounded-2xl border border-ink/15 bg-white px-4 py-3 shadow-lg shadow-ink/5 focus-within:border-ink/40"
          >
            <span className="icon-[material-symbols--search-rounded] size-5 shrink-0 text-ink-soft" />
            {tokens.map(token => (
              <span key={`${token.kind}-${token.label}`} className="inline-flex items-center gap-1.5 rounded-lg bg-accent/20 py-1 pr-1.5 pl-2 font-sans text-[13px] text-ink">
                <span className="font-mono text-[10px] tracking-wider text-accent-deep uppercase">{token.kind}</span>
                {token.label}
                <button type="button" onClick={token.drop} className="cursor-pointer">
                  <span className="icon-[material-symbols--close-rounded] size-3.5 opacity-60" />
                </button>
              </span>
            ))}
            <input
              ref={inputRef}
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(setFocused, 120, false)}
              placeholder={tokens.length ? 'and…' : 'lobster roll, Camden, cheap eats…'}
              className="min-w-[10ch] flex-1 bg-transparent py-1 font-sans text-[16px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
            />
          </div>

          {focused && suggestions.length > 0 && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-ink/10 bg-white text-left shadow-xl">
              {suggestions.map(suggestion => (
                <button
                  key={`${suggestion.kind}-${suggestion.value}`}
                  type="button"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => addToken(suggestion)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-cream"
                >
                  <span className="w-14 shrink-0 font-mono text-[10px] tracking-wider text-accent-deep uppercase">{suggestion.kind}</span>
                  <span className="flex-1 font-sans text-[15px] text-ink">
                    <Marked text={suggestion.value} query={query} />
                  </span>
                  <span className="font-mono text-[11px] text-ink-soft">{suggestion.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {tokens.length === 0 && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">Try</span>
            {facets.tags.slice(0, 4).map(facet => (
              <button
                key={facet.value}
                type="button"
                onClick={() => addToken({ kind: 'tag', value: facet.value, count: facet.count })}
                className="cursor-pointer rounded-full border border-ink/15 bg-white/70 px-3 py-1.5 font-sans text-[13px] text-ink hover:border-ink/40"
              >
                {facet.value}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <p className="mb-5 border-b border-ink/10 pb-3 font-mono text-[11px] tracking-[0.14em] text-ink-soft uppercase">
          {results.length}
          {' '}
          results
        </p>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {results.slice(0, RESULT_CAP).map(place => (
            <li key={place.id} className="group relative">
              <div className="aspect-4/3 overflow-hidden rounded-xl bg-cream">
                <img src={`https://picsum.photos/seed/${place.id}/640/480`} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h2 className="mt-3 font-display text-xl text-ink">
                <Link to="/places/$slug" params={{ slug: place.slug }} className="before:absolute before:inset-0">
                  <Marked text={place.title} query={query} />
                </Link>
              </h2>
              <p className="mt-0.5 font-mono text-[11px] tracking-[0.1em] text-ink-soft uppercase">
                {place.city}
                {priceLabel(place.price_level) ? ` · ${priceLabel(place.price_level)}` : ''}
                {place.isOpen ? ' · Open' : ''}
              </p>
              <p className="mt-1.5 line-clamp-2 font-sans text-[14px] text-ink-soft">
                <Marked text={place.description ?? ''} query={query} />
              </p>
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
          <p className="py-16 text-center font-display text-xl text-ink">Nothing matches those filters yet.</p>
        )}
      </div>
    </div>
  )
}
