/**
 * PROTOTYPE — Variant A: "Algolia ⌘K command palette".
 * Search is a modal overlay over the normal page. Nothing is inline: the page
 * keeps its grid, and every query, facet and shortcut goes through one palette.
 */
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { Place, Refinements } from './search-core'

import { metaLabel } from '../ui'
import { Marked } from './bits'
import { buildFacets, NO_REFINEMENTS, priceLabel, refine, searchPlaces, toggle, tokenize } from './search-core'

export const variantName = 'Command palette (⌘K)'

/** PROTOTYPE — render cap so 500+ rows don't muddy the judgement. */
const RESULT_CAP = 48

type Row
  = | { kind: 'place', key: string, place: Place }
    | { kind: 'town', key: string, value: string, count: number }
    | { kind: 'tag', key: string, value: string, count: number }
    | { kind: 'action', key: string, label: string, hint: string, run: () => void }

export default function VariantCommandPalette({ places }: { places: Place[] }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [recents, setRecents] = useState<string[]>([])
  const [refinements, setRefinements] = useState<Refinements>(NO_REFINEMENTS)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const facets = useMemo(() => buildFacets(places), [places])
  const results = useMemo(() => refine(places, refinements), [places, refinements])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(value => !value)
      }
      if (event.key === 'Escape')
        setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open)
      inputRef.current?.focus()
    else
      setQuery('')
  }, [open])

  const rows = useMemo<Row[]>(() => {
    const tokens = tokenize(query)
    const matches = (value: string) => tokens.every(token => value.toLowerCase().includes(token))

    const placeRows: Row[] = (tokens.length ? searchPlaces(places, query) : [...places].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)))
      .slice(0, tokens.length ? 6 : 4)
      .map(place => ({ kind: 'place', key: `place-${place.id}`, place }))

    const townRows: Row[] = facets.towns
      .filter(facet => tokens.length > 0 && matches(facet.value))
      .slice(0, 3)
      .map(facet => ({ kind: 'town', key: `town-${facet.value}`, value: facet.value, count: facet.count }))

    const tagRows: Row[] = facets.tags
      .filter(facet => tokens.length > 0 && matches(facet.value))
      .slice(0, 3)
      .map(facet => ({ kind: 'tag', key: `tag-${facet.value}`, value: facet.value, count: facet.count }))

    const actionRows: Row[] = [
      {
        kind: 'action' as const,
        key: 'action-open',
        label: refinements.openNow ? 'Clear “open now”' : 'Show only places open now',
        hint: 'Filter',
        run: () => setRefinements(current => ({ ...current, openNow: !current.openNow })),
      },
      {
        kind: 'action' as const,
        key: 'action-reset',
        label: 'Reset all filters',
        hint: 'Filter',
        run: () => setRefinements(NO_REFINEMENTS),
      },
      {
        kind: 'action' as const,
        key: 'action-submit',
        label: 'Submit a spot',
        hint: 'Go to',
        run: () => navigate({ to: '/submit' }),
      },
    ].filter(row => tokens.length === 0 || matches(row.label))

    return [...placeRows, ...townRows, ...tagRows, ...actionRows]
  }, [query, places, facets, refinements.openNow, navigate])

  useEffect(() => setCursor(0), [query])

  function commit(row: Row) {
    if (query.trim())
      setRecents(current => [query.trim(), ...current.filter(item => item !== query.trim())].slice(0, 4))

    if (row.kind === 'place') {
      setOpen(false)
      navigate({ to: '/places/$slug', params: { slug: row.place.slug } })
      return
    }
    if (row.kind === 'town')
      setRefinements(current => ({ ...current, towns: toggle(current.towns, row.value) }))
    if (row.kind === 'tag')
      setRefinements(current => ({ ...current, tags: toggle(current.tags, row.value) }))
    if (row.kind === 'action')
      row.run()
    setOpen(false)
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      event.stopPropagation()
      setCursor(current => (current + (event.key === 'ArrowDown' ? 1 : rows.length - 1)) % Math.max(rows.length, 1))
      requestAnimationFrame(() => listRef.current?.querySelector('[data-active=true]')?.scrollIntoView({ block: 'nearest' }))
    }
    if (event.key === 'Enter' && rows[cursor]) {
      event.preventDefault()
      commit(rows[cursor]!)
    }
  }

  const chips = [
    ...refinements.towns.map(value => ({ value, drop: () => setRefinements(c => ({ ...c, towns: toggle(c.towns, value) })) })),
    ...refinements.tags.map(value => ({ value, drop: () => setRefinements(c => ({ ...c, tags: toggle(c.tags, value) })) })),
    ...(refinements.openNow ? [{ value: 'Open now', drop: () => setRefinements(c => ({ ...c, openNow: false })) }] : []),
  ]

  return (
    <div className="min-h-[70vh] bg-paper">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className={metaLabel({ className: 'text-ink-soft' })}>Maine Food Map</p>
        <h1 className="mt-3 font-display text-5xl leading-[0.95] font-medium tracking-tight text-ink">Places to eat in Maine</h1>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mt-8 flex w-full max-w-xl cursor-pointer items-center gap-3 rounded-full border border-ink/15 bg-white px-5 py-3.5 text-left shadow-sm transition-colors hover:border-ink/35"
        >
          <span className="icon-[material-symbols--search-rounded] size-5 text-ink-soft" />
          <span className="flex-1 font-sans text-[15px] text-ink-soft">Search places, towns, cuisines…</span>
          <kbd className="rounded-md border border-ink/15 bg-cream px-2 py-1 font-mono text-[11px] text-ink-soft">⌘K</kbd>
        </button>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {chips.length === 0
            ? <span className="font-mono text-[11px] tracking-[0.12em] text-ink-soft/70 uppercase">No filters — press ⌘K to refine</span>
            : chips.map(chip => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={chip.drop}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 font-sans text-[13px] text-paper"
                >
                  {chip.value}
                  <span className="icon-[material-symbols--close-rounded] size-3.5 opacity-70" />
                </button>
              ))}
        </div>

        <p className="mt-8 font-mono text-[11px] tracking-[0.12em] text-ink-soft uppercase">
          {results.length}
          {' '}
          places
        </p>
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {results.slice(0, RESULT_CAP).map(place => (
            <li key={place.id}>
              <Link to="/places/$slug" params={{ slug: place.slug }} className="flex items-baseline gap-4 py-4 hover:bg-cream/60">
                <span className="flex-1 font-display text-xl text-ink">{place.title}</span>
                <span className="font-sans text-sm text-ink-soft">{place.city}</span>
                <span className="font-mono text-xs text-ink-soft">{priceLabel(place.price_level)}</span>
                <span className={place.isOpen ? 'font-mono text-[11px] tracking-widest text-green-800 uppercase' : 'font-mono text-[11px] tracking-widest text-ink-soft/60 uppercase'}>
                  {place.isOpen ? 'Open' : 'Closed'}
                </span>
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

      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-paper shadow-2xl ring-1 ring-ink/10"
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-ink/10 px-5">
              <span className="icon-[material-symbols--search-rounded] size-5 text-ink-soft" />
              <input
                ref={inputRef}
                value={query}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search places, towns, cuisines, actions…"
                className="flex-1 bg-transparent py-4 font-sans text-[17px] text-ink placeholder:text-ink-soft/60 focus:outline-none"
              />
              <kbd className="rounded-md border border-ink/15 px-2 py-1 font-mono text-[11px] text-ink-soft">esc</kbd>
            </div>

            <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
              {query.length === 0 && recents.length > 0 && (
                <>
                  <p className="px-3 pt-2 pb-1 font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">Recent</p>
                  {recents.map(recent => (
                    <button
                      key={recent}
                      type="button"
                      onClick={() => setQuery(recent)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left font-sans text-sm text-ink-soft hover:bg-cream"
                    >
                      <span className="icon-[material-symbols--history-rounded] size-4" />
                      {recent}
                    </button>
                  ))}
                </>
              )}

              {rows.length === 0 && (
                <div className="px-3 py-10 text-center">
                  <p className="font-display text-lg text-ink">
                    Nothing for “
                    {query}
                    ”
                  </p>
                  <p className="mt-1 font-sans text-sm text-ink-soft">Try a town (Portland), a cuisine (lobster), or “open now”.</p>
                </div>
              )}

              {rows.map((row, index) => {
                const previous = rows[index - 1]
                const heading = row.kind !== previous?.kind
                  ? { place: query ? 'Places' : 'Top rated', town: 'Towns', tag: 'Cuisines', action: 'Actions' }[row.kind]
                  : null
                const active = index === cursor
                return (
                  <div key={row.key}>
                    {heading && <p className="px-3 pt-3 pb-1 font-mono text-[10px] tracking-[0.14em] text-ink-soft uppercase">{heading}</p>}
                    <button
                      type="button"
                      data-active={active}
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => commit(row)}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left ${active ? 'bg-ink text-paper' : 'text-ink'}`}
                    >
                      {row.kind === 'place' && (
                        <>
                          <span className="icon-[material-symbols--restaurant-rounded] size-4 opacity-60" />
                          <span className="flex-1 font-sans text-[15px]">
                            <Marked text={row.place.title} query={query} />
                            <span className={active ? 'ml-2 text-paper/60' : 'ml-2 text-ink-soft'}>
                              <Marked text={row.place.city ?? ''} query={query} />
                            </span>
                          </span>
                          <span className={`font-mono text-[11px] ${active ? 'text-paper/70' : 'text-ink-soft'}`}>{priceLabel(row.place.price_level)}</span>
                        </>
                      )}
                      {(row.kind === 'town' || row.kind === 'tag') && (
                        <>
                          <span className={`size-4 opacity-60 ${row.kind === 'town' ? 'icon-[material-symbols--location-on-rounded]' : 'icon-[material-symbols--label-rounded]'}`} />
                          <span className="flex-1 font-sans text-[15px]">
                            <Marked text={row.value} query={query} />
                            <span className={active ? 'ml-2 text-paper/60' : 'ml-2 text-ink-soft'}>
                              {row.count}
                              {' '}
                              places
                            </span>
                          </span>
                          <span className={`font-mono text-[10px] tracking-widest uppercase ${active ? 'text-paper/70' : 'text-ink-soft'}`}>Refine</span>
                        </>
                      )}
                      {row.kind === 'action' && (
                        <>
                          <span className="icon-[material-symbols--bolt-rounded] size-4 opacity-60" />
                          <span className="flex-1 font-sans text-[15px]">{row.label}</span>
                          <span className={`font-mono text-[10px] tracking-widest uppercase ${active ? 'text-paper/70' : 'text-ink-soft'}`}>{row.hint}</span>
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-4 border-t border-ink/10 bg-cream/60 px-5 py-2.5 font-mono text-[10px] tracking-[0.1em] text-ink-soft uppercase">
              <span>↑↓ navigate</span>
              <span>↵ select</span>
              <span>esc close</span>
              <span className="ml-auto">
                {rows.length}
                {' '}
                results
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
