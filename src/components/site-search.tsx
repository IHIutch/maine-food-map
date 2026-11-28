import { useNavigate, useRouterState } from '@tanstack/react-router'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import type { Row } from './use-search-session'

import { slugifyTown } from '../utils/search'
import { useMediaQuery } from '../utils/use-media-query'
import { button, keyCap } from './ui'
import { useSearchSession } from './use-search-session'

/** React Aria's modal and Motion are browser-only, so the surfaces load on first open. */
const SearchOverlay = lazy(() => import('./search-overlay'))

export default function SiteSearch() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  // keep the overlay mounted after the first open so it can animate itself out
  const [hasOpened, setHasOpened] = useState(false)
  const isDesktop = useMediaQuery('(min-width: 640px)')
  // Hide the nav trigger where the filter bar already has search. ⌘K still works.
  const pathname = useRouterState({ select: state => state.location.pathname })
  const barOwnsSearch = isDesktop && pathname === '/'
  const session = useSearchSession(isOpen)
  const { rememberQuery, setQuery } = session

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setIsOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen)
      setHasOpened(true)
    else
      setQuery('')
  }, [isOpen, setQuery])

  const onSelect = useCallback((row: Row) => {
    rememberQuery()
    setIsOpen(false)
    if (row.kind === 'place')
      navigate({ to: '/places/$slug', params: { slug: row.hit.place.slug } })
    // Picking a town or cuisine sets that dimension and keeps the rest of the
    // filters, so search refines the current view instead of resetting it.
    else if (row.kind === 'town')
      navigate({ to: '/', search: previous => ({ ...previous, city: slugifyTown(row.hit.facet.name) }) })
    else
      navigate({ to: '/', search: previous => ({ ...previous, cuisine: row.hit.facet.slug }) })
  }, [navigate, rememberQuery])

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true })
          setIsOpen(true)
        }}
        aria-label="Search places"
        className={button({ scheme: 'outline', className: `justify-start text-left sm:min-w-64 ${barOwnsSearch ? 'sm:hidden' : ''}` })}
      >
        <span className="icon-[material-symbols--search-rounded] size-5 text-stone-500" />
        <span className="hidden flex-1 font-sans text-sm font-normal text-stone-500 sm:block">Search places…</span>
        <kbd className={keyCap({ className: 'hidden py-0.5 sm:block' })}>⌘K</kbd>
      </button>

      {hasOpened && (
        <Suspense fallback={null}>
          <SearchOverlay
            isOpen={isOpen}
            isDesktop={isDesktop}
            session={session}
            onSelect={onSelect}
            setOpen={setIsOpen}
          />
        </Suspense>
      )}
    </>
  )
}
