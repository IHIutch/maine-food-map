/**
 * PROTOTYPE — throwaway. Three policies for how search and filtering compose,
 * driven from `?variant=` on `/`. The differences are all here; the variants
 * just render them.
 */
import type { PlaceFilters } from '../../utils/place-filters'

export interface ComposePolicy {
  /** Does the search box look only inside the current filters? */
  scopeToFilters: boolean
  /** Picking a second cuisine — add to the first, or replace it? */
  unionWithinDimension: boolean
  /** Do the words you typed survive as a filter of their own? */
  keepTypedTerm: boolean
}

export const POLICIES: Record<'A' | 'B' | 'C', ComposePolicy & { name: string, blurb: string }> = {
  A: {
    name: 'Search writes filters (today)',
    blurb: 'Search sees every place. Picking a facet sets that dimension and keeps the others; typed words are dropped.',
    scopeToFilters: false,
    unionWithinDimension: false,
    keepTypedTerm: false,
  },
  B: {
    name: 'One refinement set',
    blurb: 'Typed words become a filter of their own, search looks only inside the current filters, and picking a second cuisine adds to the first.',
    scopeToFilters: true,
    unionWithinDimension: true,
    keepTypedTerm: true,
  },
  C: {
    name: 'Search is the only control',
    blurb: 'No filter bar. One input: type to add facets or free text, and everything you have chosen lives in it as tokens.',
    scopeToFilters: true,
    unionWithinDimension: true,
    keepTypedTerm: true,
  },
}

export function setDimension(
  filters: PlaceFilters,
  dimension: 'city' | 'cuisine' | 'price',
  value: string,
  policy: ComposePolicy,
): PlaceFilters {
  const current = filters[dimension]
  const next = policy.unionWithinDimension
    ? (current.includes(value) ? current.filter(item => item !== value) : [...current, value])
    : (current.length === 1 && current[0] === value ? [] : [value])
  return { ...filters, [dimension]: next }
}

export function matchesTerm(text: string, term: string) {
  const needle = term.trim().toLowerCase()
  if (!needle)
    return true
  return needle.split(/\s+/).every(word => text.toLowerCase().includes(word))
}
