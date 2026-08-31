# Prototype: how search and filtering compose

**Question:** with a filter bar and a ⌘K palette both narrowing the same list,
how should they share state?

Two artefacts:

- `src/components/prototype-compose/` — three in-app variants behind `?variant=`
  on `/`. The whole difference is three booleans in `compose-core.ts`:
  `scopeToFilters`, `unionWithinDimension`, `keepTypedTerm`.
- `PROTOTYPE-search-filter-composition.html` — a standalone reducer demo of the
  same three policies, drivable by anyone with no install.

| | Policy | Behaviour |
|---|---|---|
| A | Search writes filters (today) | search sees every place; picking a facet sets that dimension and keeps the others; typed words dropped |
| B | One refinement set | typed words become a `q` filter, search scoped to current filters, second cuisine adds rather than replaces |
| C | Search is the only control | no filter bar; every refinement is a token in one input |

## Verdict

**A, merged into the shipped bar** — on desktop the search field and the filter
menus share the second nav row. Mobile keeps what shipped: the nav search icon
plus the `Filters` button and its sheet.

B and C were rejected as defaults, but both surfaced questions worth revisiting:

- **Scope.** B's scoped search ("in 18" not "all 526") never offers results you
  can't see — but it dead-ends: filtered to South Portland, searching "lobster"
  gives 0 where a global search finds 3. An escape hatch ("search everywhere
  instead") would be needed before scoping is safe.
- **Typed words.** A drops them, so "lobster roll" or "patio" — searches that
  aren't a town or a cuisine — leave nothing behind. B's `q` token fixes that and
  is the strongest candidate for a follow-up.
- **What free text searches over.** B counted "2 places" in the suggestion while
  the list showed 12, because the suggestion matched name/town/cuisine and the
  list also matched descriptions. Any `q` implementation has to pick one.
