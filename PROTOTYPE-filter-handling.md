# Prototype: filter handling on the places index

**Question:** what shape should filtering take on `/`, and does the ⌘K search
replace a filter bar or sit alongside it?

Four variants ran behind `?variant=` on the existing route:

| | Variant | Shape |
|---|---|---|
| A | Facet bar + dropdowns | a chip per dimension, each opening a checkbox menu with faceted counts |
| B | Chip rail | one scrolling line of toggle chips, selected ones hop to the front |
| C | Filter sheet | a single `Filters (n)` button opening a drawer; edits staged, committed via "Show N places" |
| D | Search-led tokens | no filter chrome at all — everything enters through ⌘K, active filters render as removable tokens |

## Verdict

**A's dropdowns on desktop, C's sheet on mobile, B's chip styling throughout.**
D was rejected as the only entry point, but search still writes into the same
filter state, so the two now compose.

Folded into main as `src/components/place-filters.tsx` (responsive: bar above
640px, sheet below), `src/utils/place-filters.ts` (facet maths), and the
`filterChip` / `filterMenu` recipes in `ui.ts`.

## What the prototype settled beyond the layout

- **Counts must be faceted per dimension** — each option counts against the
  *other* active filters, otherwise the numbers lie as soon as two filters are on.
- **Staging matters on mobile.** Live-updating a list under a thumb is jarring;
  the "Show N places" preview also warns before you commit a zero-result filter.
- **Filters belong in the URL, comma-separated** (`?cuisine=seafood,thai`), not
  as component state — shareable, and the palette can navigate straight into one.
- **An empty state is now reachable**, which it never was before filtering.

## Bugs it shook out (both fixed in main)

1. `will-change-transform` on `#app-shell` made the shell a containing block, so
   *any* `position: fixed` child stopped being viewport-fixed. Now applied only
   while a bottom sheet is open.
2. The command palette navigated with `search: { city }`, replacing every other
   search param — so picking a town silently dropped an active cuisine filter.
   It now merges.

## Note

The variant source was deleted during the fold-in before it was committed here,
so this branch holds the decision rather than the code. The winning behaviour
lives in main; A/B/D exist only as this description.
