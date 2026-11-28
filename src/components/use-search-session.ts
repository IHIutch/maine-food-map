import { useCallback, useEffect, useMemo, useState } from 'react'

import type { FacetHit, PlaceHit, SearchIndex } from '../utils/search'

import { aliasCuisines, createFacetSearcher, createPlaceSearcher, searchFacets, searchPlaces } from '../utils/search'
import { getSearchIndex } from '../utils/search-fn'

const RECENTS_KEY = 'mfm.search.recents'
const PLACE_LIMIT = 5
const FACET_LIMIT = 3

export type Row
  = | { kind: 'place', key: string, hit: PlaceHit }
    | { kind: 'town', key: string, hit: FacetHit }
    | { kind: 'cuisine', key: string, hit: FacetHit }

function readRecents() {
  if (typeof window === 'undefined')
    return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENTS_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as string[]).slice(0, 4) : []
  }
  catch {
    return []
  }
}

/** One search session: the index, the query, the flattened rows and the cursor. */
export function useSearchSession(isOpen: boolean) {
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const [recents, setRecents] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen)
      return
    setRecents(readRecents())
    if (index || status !== 'idle')
      return
    setStatus('loading')
    getSearchIndex()
      .then((result) => {
        setIndex(result)
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }, [isOpen, index, status])

  // Fuse builds an index per collection; keep them alive for the whole session.
  const searchers = useMemo(() => index && ({
    places: createPlaceSearcher(index.places),
    towns: createFacetSearcher(index.towns),
    cuisines: createFacetSearcher(index.cuisines),
  }), [index])

  const rows = useMemo(() => {
    if (!index || !searchers)
      return []

    // Pin cuisines matched by query aliases and include them in the place search.
    const aliased = aliasCuisines(query, index.cuisines)
    const aliasTerms = aliased.map(cuisine => ({ name: cuisine.name, exact: cuisine.exact }))

    const places = searchPlaces(searchers.places, index.places, query, PLACE_LIMIT, aliasTerms)
      .map(hit => ({
        kind: 'place',
        key: `place-${hit.place.id}`,
        hit,
      } as const))
    const cuisines = searchFacets(searchers.cuisines, query, FACET_LIMIT, aliased)
      .map(hit => ({
        kind: 'cuisine',
        key: `cuisine-${hit.facet.slug}`,
        hit,
      } as const))
    const towns = searchFacets(searchers.towns, query, FACET_LIMIT)
      .map(hit => ({
        kind: 'town',
        key: `town-${hit.facet.slug}`,
        hit,
      } as const))
    return [...cuisines, ...towns, ...places]
  }, [index, searchers, query])

  useEffect(() => setCursor(0), [query])

  const rememberQuery = useCallback(() => {
    const trimmed = query.trim()
    if (!trimmed)
      return
    const next = [trimmed, ...recents.filter(item => item !== trimmed)].slice(0, 4)
    setRecents(next)
    try {
      window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next))
    }
    catch {
      // Storage may be unavailable in private browsing. Search still works.
    }
  }, [query, recents])

  return {
    index,
    status,
    retry: () => setStatus('idle'),
    query,
    setQuery,
    rows,
    cursor,
    setCursor,
    recents,
    rememberQuery,
  }
}

export type SearchSession = ReturnType<typeof useSearchSession>
