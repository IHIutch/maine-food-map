import { tv } from 'tailwind-variants'

/* Pill button: blueberry(primary) / stone(dark) / outline(ghost) */
export const button = tv({
  base: 'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 leading-none font-medium transition-colors',
  variants: {
    scheme: {
      blueberry: 'bg-blueberry-500 text-white hover:border-blueberry-700 hover:bg-blueberry-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry-600',
      stone: 'bg-stone-800 text-white hover:bg-stone-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry-600',
      outline: 'border border-stone-300 bg-white text-black hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry-600',
    },
    size: {
      base: 'h-10 text-sm',
      sm: 'h-9 text-sm',
      lg: 'h-12 text-base',
    },
  },
  defaultVariants: {
    scheme: 'blueberry',
    size: 'base',
  },
})

/* Mono caps micro-label (DM Mono) */
export const metaLabel = tv({
  base: 'font-mono text-[11px] font-medium tracking-[0.12em] uppercase',
})

/* Uppercase label with an optional accent bar */
export const eyebrow = tv({
  base: 'font-mono text-[11px] font-medium tracking-[0.14em] text-stone-500 uppercase',
  variants: {
    bar: {
      true: 'inline-flex items-center gap-2.5 before:h-0.5 before:w-7 before:bg-blueberry-500 before:content-[""]',
    },
  },
})

/* Serif display heading with tight line spacing */
export const displayHeading = tv({
  base: 'font-display leading-[0.95] font-medium tracking-[-0.02em] text-ink',
})

/* Pill tags: plain / price(mono, hairline) / status(dot: pine=open, tomato=closed) */
export const tag = tv({
  base: 'inline-flex h-7 items-center rounded-full px-2.5 font-sans text-xs font-medium',
  variants: {
    tone: {
      plain: 'border border-stone-300 text-ink',
      price: 'border border-stone-300 font-mono tracking-[0.08em] text-ink',
      status: 'gap-1.5 before:size-2 before:rounded-full before:content-[\'\']',
    },
    isOpen: {
      true: '',
      false: '',
    },
    onImage: {
      true: 'bg-white shadow-sm shadow-black/10',
    },
  },
  compoundVariants: [
    { tone: 'status', isOpen: true, class: 'bg-green-800/10 text-green-800 before:bg-green-800' },
    { tone: 'status', isOpen: false, class: 'bg-red-800/10 text-red-800 before:bg-red-800' },
    { tone: 'status', onImage: true, class: 'bg-white' },
  ],
  defaultVariants: {
    tone: 'plain',
  },
})

/* Footer navigation text */
export const footerLink = tv({
  base: 'text-[15px] text-white/80 transition-colors hover:text-white',
})

/* Modal panel with sheet and dialog layouts */
export const overlaySurface = tv({
  base: 'bg-white shadow-2xl ring-1 ring-ink/10',
  variants: {
    shape: {
      sheet: 'flex w-full flex-col rounded-t-2xl will-change-transform',
      dialog: 'w-full max-w-2xl overflow-hidden rounded-2xl',
    },
  },
  defaultVariants: {
    shape: 'sheet',
  },
})

/* Scrim behind a modal surface */
export const overlayScrim = tv({
  base: 'fixed inset-0 z-50',
  variants: {
    centered: {
      true: 'flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm',
    },
  },
})

/* Grab handle at the top of a drawer */
export const sheetHandle = tv({
  base: 'mx-auto mt-2 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-ink/20',
})

/* Search input without a border inside the palette */
export const searchField = tv({
  base: 'min-w-0 flex-1 bg-transparent py-4 font-sans text-[17px] text-ink placeholder:text-stone-400 focus:outline-none [&::-webkit-search-cancel-button]:hidden',
})

/* One result in the command palette */
export const paletteRow = tv({
  base: 'flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 text-left sm:py-2.5',
  variants: {
    active: {
      true: 'bg-ink text-white',
      false: 'text-ink',
    },
  },
  defaultVariants: {
    active: false,
  },
})

/* Secondary text color for active and inactive palette rows */
export const paletteRowMeta = tv({
  base: 'text-[13px]',
  variants: {
    active: {
      true: 'text-white/60',
      false: 'text-stone-500',
    },
  },
})

/* Trailing hint in a palette row (Browse, ↵, …) */
export const paletteRowHint = tv({
  base: 'shrink-0 font-mono text-[10px] tracking-widest uppercase',
  variants: {
    active: {
      true: 'text-white/70',
      false: 'text-stone-500',
    },
  },
})

/* Open / closed as mono caps, for dense rows where a tag pill would be too loud */
export const statusLabel = tv({
  base: 'font-mono text-[10px] tracking-widest uppercase',
  variants: {
    isOpen: {
      true: 'text-green-800',
      false: 'text-stone-400',
    },
    onDark: {
      true: 'text-white/70',
    },
  },
})

/* Keyboard key cap */
export const keyCap = tv({
  base: 'rounded-md border border-ink/15 px-2 py-1 font-mono text-[11px] text-stone-500',
})

/* Hairline footer strip carrying keyboard hints */
export const hintBar = tv({
  base: 'flex items-center gap-4 border-t border-ink/10 bg-stone-50 px-5 py-2.5 font-mono text-[10px] tracking-widest text-stone-500 uppercase',
})

/* Highlighted substring in a search result */
export const searchMark = tv({
  base: 'rounded-[3px] bg-blueberry-100 px-px text-ink',
})

/* Filter toggle shared by the filter bar and sheet */
export const filterChip = tv({
  base: 'inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 font-sans text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry-600',
  variants: {
    active: {
      true: 'border-blueberry-500 bg-blueberry-50 text-blueberry-700',
      false: 'border-stone-300 bg-white text-ink hover:bg-stone-100',
    },
  },
  defaultVariants: {
    active: false,
  },
})

/* Count inside a filter chip */
export const filterChipCount = tv({
  base: 'font-mono text-[10px] tabular-nums opacity-55',
})

/* Dropdown panel for a filter chip */
export const filterMenu = tv({
  base: 'z-40 max-h-80 w-64 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2 shadow-xl',
})

/* One checkable row inside a filter menu */
export const filterMenuOption = tv({
  base: 'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 data-highlighted:bg-stone-100',
})

/* Segmented control for switching between map and list views */
export const segmented = tv({
  base: 'inline-flex h-9 shrink-0 items-center gap-0.5 rounded-full border border-stone-300 bg-white p-0.5',
})

export const segmentedItem = tv({
  base: 'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 font-sans text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry-600',
  variants: {
    active: {
      true: 'bg-stone-900 text-white',
      false: 'text-ink hover:bg-stone-100',
    },
  },
  defaultVariants: {
    active: false,
  },
})
