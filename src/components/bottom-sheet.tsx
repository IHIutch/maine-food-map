/**
 * iOS-style bottom sheet: drags to dismiss, and (at full size) scales the page
 * behind it. Client-only — React Aria's modal and Motion both assume a DOM, and
 * the worker SSR runtime can't load them, so import this lazily.
 *
 * The sheet animates itself in and out imperatively rather than through Motion's
 * `animate` prop, because that prop doesn't drive a motion value which is also
 * passed in `style` — and owning the exit animation is what lets the sheet finish
 * sliding out before it unmounts.
 */
import type { PanInfo } from 'motion/react'
import type { ReactNode } from 'react'

import {
  animate,
  cubicBezier,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'motion/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Dialog, Modal, ModalOverlay } from 'react-aria-components'

import { overlayScrim, overlaySurface, sheetHandle } from './ui'

const MotionModal = motion.create(Modal)
const MotionModalOverlay = motion.create(ModalOverlay)

const SHEET_MARGIN = 34
const SHEET_RADIUS = 12

const sheetTransition = { duration: 0.5, ease: cubicBezier(0.32, 0.72, 0, 1) }
const inertiaTransition = { type: 'inertia' as const, bounceStiffness: 300, bounceDamping: 40, timeConstant: 300 }

interface BottomSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible name for the dialog. */
  label: string
  /** `full` fills the screen below a top margin; `auto` hugs its content. */
  size?: 'full' | 'auto'
  children: ReactNode
}

/** Keeps the sheet mounted until its exit animation has finished. */
export default function BottomSheet({ isOpen, onOpenChange, label, size = 'full', children }: BottomSheetProps) {
  const [isMounted, setMounted] = useState(false)

  useEffect(() => {
    if (isOpen)
      setMounted(true)
  }, [isOpen])

  const onClosed = useCallback(() => setMounted(false), [])

  if (!isMounted)
    return null

  return (
    <Sheet isOpen={isOpen} onOpenChange={onOpenChange} onClosed={onClosed} label={label} size={size}>
      {children}
    </Sheet>
  )
}

function Sheet({ isOpen, onOpenChange, onClosed, label, size, children }: Required<Omit<BottomSheetProps, 'children'>> & {
  onClosed: () => void
  children: ReactNode
}) {
  const isFull = size === 'full'
  const modalRef = useRef<HTMLDivElement>(null)
  // How far the sheet travels to get off-screen. An `auto` sheet doesn't know
  // that until it has been measured, so it starts at a full screen height.
  const [travel, setTravel] = useState(() => (isFull ? window.innerHeight - SHEET_MARGIN : window.innerHeight))
  const y = useMotionValue(travel)

  const bgOpacity = useTransform(y, [0, travel], [0.4, 0])
  const bg = useMotionTemplate`rgba(28, 35, 32, ${bgOpacity})`

  const [shell, setShell] = useState<HTMLElement | null>(null)
  useEffect(() => setShell(isFull ? document.getElementById('app-shell') : null), [isFull])

  const shellScale = useTransform(y, [0, travel], [(window.innerWidth - SHEET_MARGIN) / window.innerWidth, 1])
  const shellTranslate = useTransform(y, [0, travel], [SHEET_MARGIN - SHEET_RADIUS, 0])
  const shellRadius = useTransform(y, [0, travel], [SHEET_RADIUS, 0])

  useLayoutEffect(() => {
    if (isFull || !modalRef.current)
      return
    const measured = modalRef.current.offsetHeight
    if (measured > 0 && measured !== travel) {
      setTravel(measured)
      if (!y.isAnimating())
        y.set(measured)
    }
  }, [isFull, travel, y])

  useEffect(() => {
    if (!shell)
      return
    // The page still scrolls on the body, so anchor the shrink to what's on screen.
    shell.style.transformOrigin = `50% ${window.scrollY}px`
    shell.style.overflow = 'clip'
    // Only while the sheet is up: will-change makes the shell a containing block,
    // which would otherwise break `position: fixed` for everything inside it.
    shell.style.willChange = 'transform'
    return () => {
      shell.style.willChange = ''
      shell.style.scale = ''
      shell.style.translate = ''
      shell.style.borderRadius = ''
      shell.style.transformOrigin = ''
      shell.style.overflow = ''
    }
  }, [shell])

  useMotionValueEvent(shellScale, 'change', (value) => {
    if (shell)
      shell.style.scale = `${value}`
  })
  useMotionValueEvent(shellTranslate, 'change', (value) => {
    if (shell)
      shell.style.translate = `0 ${value}px`
  })
  useMotionValueEvent(shellRadius, 'change', (value) => {
    if (shell)
      shell.style.borderRadius = `${value}px`
  })

  useEffect(() => {
    if (isOpen) {
      animate(y, 0, sheetTransition)
      return
    }
    const animation = animate(y, travel, sheetTransition)
    animation.then(onClosed)
    return () => animation.stop()
  }, [isOpen, y, travel, onClosed])

  function onDragEnd(_event: unknown, { offset, velocity }: PanInfo) {
    if (offset.y > travel * 0.4 || velocity.y > 10)
      onOpenChange(false)
    else
      animate(y, 0, { ...inertiaTransition, min: 0, max: 0 })
  }

  return (
    <MotionModalOverlay
      isOpen
      onOpenChange={onOpenChange}
      isDismissable
      className={overlayScrim()}
      style={{ backgroundColor: bg }}
    >
      <MotionModal
        ref={modalRef}
        className={overlaySurface({ shape: 'sheet', className: isFull ? 'absolute bottom-0' : 'absolute bottom-0 max-h-[85svh]' })}
        style={{ y, ...(isFull ? { top: SHEET_MARGIN } : {}) }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        onDragEnd={onDragEnd}
      >
        <div className={sheetHandle()} />
        <Dialog aria-label={label} className="flex min-h-0 flex-1 flex-col outline-hidden">
          {children}
        </Dialog>
      </MotionModal>
    </MotionModalOverlay>
  )
}
