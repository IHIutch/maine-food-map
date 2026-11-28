/**
 * Client-only search surfaces. React Aria's modal and Motion both assume a DOM,
 * and the worker SSR runtime can't load them, so this module is lazily imported
 * the first time the palette opens.
 */
import { AnimatePresence, cubicBezier, motion } from 'motion/react'
import { useCallback, useRef } from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'

import type { PlaceDoc, Range } from '../utils/search'
import type { Row, SearchSession } from './use-search-session'

import { highlight } from '../utils/search'
import BottomSheet from './bottom-sheet'
import {
  displayHeading,
  eyebrow,
  hintBar,
  keyCap,
  metaLabel,
  overlayScrim,
  overlaySurface,
  paletteRow,
  paletteRowHint,
  paletteRowMeta,
  searchField,
  searchMark,
  statusLabel,
} from './ui'

const MotionModal = motion.create(Modal)
const MotionModalOverlay = motion.create(ModalOverlay)

const GROUP_LABELS = { place: 'Places', town: 'Locations', cuisine: 'Cuisines' } as const

/** Show the cuisine the query is about, not just the first one derived. */
function cuisineFor(place: PlaceDoc, query: string) {
  const needle = query.trim().toLowerCase()
  const matched = needle ? place.cuisines.find(cuisine => cuisine.toLowerCase().includes(needle)) : null
  return matched ?? place.cuisines[0] ?? null
}

function Marked({ text, ranges }: { text: string, ranges: Range[] }) {
  return (
    <>
      {highlight(text, ranges).map((run, index) =>
        run.hit
          ? <mark key={`${index}-${run.text}`} className={searchMark()}>{run.text}</mark>
          : <span key={`${index}-${run.text}`}>{run.text}</span>,
      )}
    </>
  )
}

interface PanelProps {
  session: SearchSession
  onSelect: (row: Row) => void
  onClose: () => void
  showHints: boolean
}

/** The input + result list, shared by the sheet and the desktop dialog. */
function SearchPanel({ session, onSelect, onClose, showHints }: PanelProps) {
  const { query, setQuery, rows, cursor, setCursor, recents, status, index, retry } = session
  const listRef = useRef<HTMLDivElement>(null)

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (rows.length === 0)
        return
      setCursor((current: number) => (current + (event.key === 'ArrowDown' ? 1 : rows.length - 1)) % rows.length)
      requestAnimationFrame(() =>
        listRef.current?.querySelector('[data-active=true]')?.scrollIntoView({ block: 'nearest' }))
    }
    if (event.key === 'Enter' && rows[cursor]) {
      event.preventDefault()
      onSelect(rows[cursor]!)
    }
  }

  const totalPlaces = index?.places.length ?? 0

  return (
    <>
      <div className="flex items-center gap-3 border-b border-ink/10 px-4 sm:px-5">
        <span className="icon-[material-symbols--search-rounded] size-5 shrink-0 text-stone-500" />
        <input
          // a search dialog exists to be typed in
          autoFocus
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search places, locations and cuisines"
          placeholder="Place, town or cuisine…"
          className={searchField()}
        />
        {showHints
          ? <kbd className={keyCap()}>esc</kbd>
          : (
              <button type="button" onClick={onClose} className="-mr-1 cursor-pointer px-1 py-2 font-sans text-[15px] font-medium text-blueberry-600">
                Cancel
              </button>
            )}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-auto p-2 pb-[env(safe-area-inset-bottom)] sm:max-h-[52vh] sm:flex-none sm:overscroll-contain sm:pb-2">
        {status === 'loading' && (
          <p className={metaLabel({ className: 'block px-3 py-10 text-center text-stone-500' })}>Loading places…</p>
        )}

        {status === 'error' && (
          <p className="px-3 py-10 text-center font-sans text-sm text-stone-500">
            Search is unavailable right now.
            {' '}
            <button type="button" onClick={retry} className="cursor-pointer underline">Try again</button>
          </p>
        )}

        {status !== 'loading' && query.length === 0 && recents.length > 0 && (
          <>
            <p className={eyebrow({ className: 'px-3 pt-2 pb-1' })}>Recent</p>
            {recents.map(recent => (
              <button
                key={recent}
                type="button"
                onClick={() => setQuery(recent)}
                className={paletteRow({ className: 'font-sans text-[15px] text-stone-500 hover:bg-stone-100' })}
              >
                <span className="icon-[material-symbols--history-rounded] size-4" />
                {recent}
              </button>
            ))}
          </>
        )}

        {status === 'idle' && rows.length === 0 && query.length > 0 && (
          <div className="px-3 py-10 text-center">
            <p className={displayHeading({ className: 'text-lg' })}>
              Nothing for “
              {query}
              ”
            </p>
            <p className="mt-1 font-sans text-sm text-stone-500">Try a town like Camden, or a cuisine like seafood.</p>
          </div>
        )}

        {rows.map((row, position) => {
          const heading = row.kind !== rows[position - 1]?.kind
            ? (query ? GROUP_LABELS[row.kind] : 'Top rated')
            : null
          const active = position === cursor
          return (
            <div key={row.key}>
              {heading && <p className={eyebrow({ className: 'px-3 pt-3 pb-1' })}>{heading}</p>}
              <button
                type="button"
                data-active={active}
                onMouseEnter={() => setCursor(position)}
                onClick={() => onSelect(row)}
                className={paletteRow({ active })}
              >
                {row.kind === 'place'
                  ? (
                      <>
                        <span className="icon-[material-symbols--restaurant-rounded] size-4 shrink-0 opacity-60" />
                        <span className="min-w-0 flex-1 font-sans text-[15px]">
                          <span className="block truncate">
                            <Marked text={row.hit.place.title} ranges={row.hit.title} />
                          </span>
                          <span className={paletteRowMeta({ active, className: 'block truncate' })}>
                            <Marked text={row.hit.place.city ?? ''} ranges={row.hit.city} />
                            {cuisineFor(row.hit.place, query) ? ` · ${cuisineFor(row.hit.place, query)}` : ''}
                            {row.hit.place.priceLabel ? ` · ${row.hit.place.priceLabel}` : ''}
                          </span>
                        </span>
                        <span className={statusLabel({ isOpen: row.hit.place.isOpen, onDark: active, className: 'shrink-0' })}>
                          {row.hit.place.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </>
                    )
                  : (
                      <>
                        <span className={`size-4 shrink-0 opacity-60 ${row.kind === 'town' ? 'icon-[material-symbols--location-on-rounded]' : 'icon-[material-symbols--label-rounded]'}`} />
                        <span className="min-w-0 flex-1 truncate font-sans text-[15px]">
                          <Marked text={row.hit.facet.name} ranges={row.hit.name} />
                          <span className={paletteRowMeta({ active, className: 'ml-2' })}>
                            {row.hit.facet.count}
                            {' '}
                            places
                          </span>
                        </span>
                        <span className={paletteRowHint({ active })}>
                          Browse
                        </span>
                      </>
                    )}
              </button>
            </div>
          )
        })}
      </div>

      {showHints && (
        <div className={hintBar()}>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="ml-auto">
            {query ? `${rows.length} results` : `${totalPlaces} places`}
          </span>
        </div>
      )}
    </>
  )
}

interface SurfaceProps extends Omit<PanelProps, 'showHints'> {
  setOpen: (open: boolean) => void
}

function DesktopPalette({ session, onSelect, onClose, setOpen }: SurfaceProps) {
  return (
    <MotionModalOverlay
      isOpen
      onOpenChange={setOpen}
      isDismissable
      className={overlayScrim({ centered: true })}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <MotionModal
        className={overlaySurface({ shape: 'dialog' })}
        initial={{ opacity: 0, scale: 0.98, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -8 }}
        transition={{ duration: 0.18, ease: cubicBezier(0.32, 0.72, 0, 1) }}
      >
        <Dialog aria-label="Search places" className="flex flex-col outline-hidden">
          <SearchPanel session={session} onSelect={onSelect} onClose={onClose} showHints />
        </Dialog>
      </MotionModal>
    </MotionModalOverlay>
  )
}

export default function SearchOverlay({ isOpen, isDesktop, session, onSelect, setOpen }: {
  isOpen: boolean
  isDesktop: boolean
  session: SearchSession
  onSelect: (row: Row) => void
  setOpen: (open: boolean) => void
}) {
  const onClose = useCallback(() => setOpen(false), [setOpen])

  if (isDesktop) {
    return (
      <AnimatePresence>
        {isOpen && <DesktopPalette session={session} onSelect={onSelect} onClose={onClose} setOpen={setOpen} />}
      </AnimatePresence>
    )
  }

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={setOpen} label="Search places">
      <SearchPanel session={session} onSelect={onSelect} onClose={onClose} showHints={false} />
    </BottomSheet>
  )
}
