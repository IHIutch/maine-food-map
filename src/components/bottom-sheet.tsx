/**
 * React Aria coordinates content scrolling and swipe dismissal using native
 * scroll snapping. Import lazily to keep the overlay out of the Worker runtime.
 */
import type { ReactNode, RefObject } from 'react'

import { useEffect, useRef, useState } from 'react'
import { Button, Sheet, SheetBackdrop, SheetContent, SheetOverlay } from 'react-aria-components'

import { sheetHandle } from './ui'

interface BottomSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  label: string
  /** `full` fills the screen below a top margin; `auto` fits its content. */
  size?: 'full' | 'auto'
  children: ReactNode
}

export default function BottomSheet({ isOpen, onOpenChange, label, size = 'full', children }: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [session, setSession] = useState(() => ({
    isOpen,
    key: 0,
    focusTarget: typeof document === 'undefined' ? null : document.activeElement as HTMLElement | null,
  }))
  // A fresh overlay cancels an unfinished native exit when the caller reopens.
  if (session.isOpen !== isOpen) {
    const active = document.activeElement as HTMLElement | null
    const focusTarget = isOpen && !contentRef.current?.contains(active)
      ? active
      : session.focusTarget
    setSession({ isOpen, key: session.key + Number(isOpen), focusTarget })
  }

  return (
    <SheetOverlay key={session.key} isOpen={isOpen} onOpenChange={onOpenChange} className="z-50">
      <SheetBackdrop data-food-sheet-backdrop swipeAnimation="food-sheet-fade" />
      <Sheet data-food-sheet-size={size} overscrollPadding>
        <SheetContent ref={contentRef} aria-label={label} data-food-sheet-content>
          <SheetFocusReturn target={session.focusTarget} />
          {size === 'full' && <SheetBackground contentRef={contentRef} />}
          <div className="relative flex h-11 shrink-0 items-center justify-center">
            <span aria-hidden className={sheetHandle({ className: 'm-0' })} />
            <Button slot="close" aria-label="Close drawer" className="absolute top-0 right-1 flex size-11 cursor-pointer items-center justify-center rounded-full text-stone-500 outline-offset-[-4px] focus-visible:outline-2 focus-visible:outline-blueberry-600">
              <span aria-hidden className="icon-[material-symbols--close-rounded] size-5" />
            </Button>
          </div>
          {children}
        </SheetContent>
      </Sheet>
    </SheetOverlay>
  )
}

function SheetBackground({ contentRef }: { contentRef: RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const shell = document.getElementById('app-shell')
    if (!shell || !contentRef.current)
      return
    const origin = shell.style.transformOrigin
    shell.style.transformOrigin = `50% ${window.scrollY}px`
    shell.style.setProperty('--sheet-background-timeline', getComputedStyle(contentRef.current).getPropertyValue('view-timeline-name'))
    shell.style.setProperty('--sheet-background-scale', String((window.innerWidth - 34) / window.innerWidth))
    shell.setAttribute('data-sheet-background', '')
    return () => {
      shell.removeAttribute('data-sheet-background')
      shell.style.removeProperty('--sheet-background-scale')
      shell.style.removeProperty('--sheet-background-timeline')
      shell.style.transformOrigin = origin
    }
  }, [contentRef])

  return null
}

function SheetFocusReturn({ target }: { target: HTMLElement | null }) {
  useEffect(() => () => {
    // Preserve the original trigger across a reopen that replaces an exiting overlay.
    requestAnimationFrame(() => {
      if (target?.isConnected && !document.querySelector('[data-food-sheet-content]'))
        target.focus({ preventScroll: true })
    })
  }, [target])

  return null
}
