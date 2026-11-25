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

/* Eyebrow — mono caps, optionally led by a short accent bar */
export const eyebrow = tv({
  base: 'font-mono text-[11px] font-medium tracking-[0.14em] text-stone-500 uppercase',
  variants: {
    bar: {
      true: 'inline-flex items-center gap-2.5 before:h-0.5 before:w-7 before:bg-blueberry-500 before:content-[""]',
    },
  },
})

/* Mono section title with hairline rule */
export const sectionTitle = tv({
  base: 'mb-5 border-b border-ink/15 pb-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-stone-500 uppercase',
})

/* Editorial serif — soft terminals, tight leading */
export const displayHeading = tv({
  base: 'font-display leading-[0.95] font-medium tracking-[-0.02em] text-ink',
})

/* Italic display lede/blurb */
export const lede = tv({
  base: 'font-display leading-[1.4] font-normal text-ink italic',
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

/* Filter pill / segmented control */
export const pillFilter = tv({
  base: 'rounded-full border px-3.5 py-[7px] font-sans text-[13px] leading-none font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  variants: {
    active: {
      true: 'border-ink bg-ink text-white',
      false: 'border-ink/20 bg-white text-ink hover:bg-stone-100',
    },
  },
  defaultVariants: {
    active: false,
  },
})

/* Rounded input */
export const input = tv({
  base: 'w-full rounded-lg border border-ink/20 bg-white px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-stone-400 focus:border-ink focus:outline-none',
  variants: {
    onDark: {
      true: 'border-white/30 bg-transparent text-white placeholder:text-white/50 focus:border-white',
    },
  },
})

/* Form scaffolding */
export const formSection = tv({
  base: 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm shadow-stone-950/5 sm:p-7',
})

export const fieldLabel = tv({
  base: 'mb-2 block font-instrument text-sm font-semibold text-stone-900',
})

export const fieldHint = tv({
  base: 'mt-1.5 text-sm leading-5 text-stone-500',
})

export const fieldError = tv({
  base: 'mt-1.5 text-sm font-medium text-red-800',
})

/* Underline link */
export const link = tv({
  base: 'rounded-sm underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  variants: {
    tone: {
      ink: 'text-ink decoration-ink/30 hover:decoration-ink',
      accent: 'text-blueberry-600 decoration-blueberry-300 hover:decoration-blueberry-600',
      paper: 'text-white decoration-white/40 hover:decoration-white',
    },
  },
  defaultVariants: {
    tone: 'accent',
  },
})

/* Top-nav link with animated underline */
export const navLink = tv({
  base: 'relative py-1.5 font-sans text-[13.5px] text-ink no-underline after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-blueberry-500 after:transition-transform after:duration-200 after:content-[""] hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  variants: {
    active: {
      true: 'after:scale-x-100',
    },
  },
})

/* Footer nav item — plain, paper-on-ink */
export const footerLink = tv({
  base: 'text-[15px] text-white/80 transition-colors hover:text-white',
})

/* Mono caps meta line joined with middots */
export const metaRow = tv({
  base: 'flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[11px] font-medium tracking-widest uppercase',
})

/* Modal surface — paper, hairline ring, soft lift (sheet = bottom drawer, dialog = centred) */
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

/* Search field inside a palette — chromeless, the surface provides the frame */
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

/* Supporting line inside a palette row — dims against an active (ink) row */
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

/* Filter chip — the toggle used in the filter bar and inside the filter sheet */
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

/* The count that rides along inside a filter chip */
export const filterChipCount = tv({
  base: 'font-mono text-[10px] tabular-nums opacity-55',
})

/* Dropdown panel hung off a filter chip */
export const filterMenu = tv({
  base: 'z-40 max-h-80 w-64 overflow-y-auto rounded-xl border border-stone-200 bg-white p-2 shadow-xl',
})

/* One checkable row inside a filter menu */
export const filterMenuOption = tv({
  base: 'flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 data-highlighted:bg-stone-100',
})

/* Segmented control — currently the map ⇄ list switch in the filter row */
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

/* Photo tile in a place's picture grid — a hero leads, thumbs fill the column beside it */
export const photoTile = tv({
  base: 'h-full overflow-hidden rounded-xl bg-stone-100 md:rounded-b-none',
  variants: {
    role: {
      solo: 'col-span-3 row-span-2',
      hero: 'col-span-2 row-span-2',
      column: 'col-span-1 row-span-2',
      thumb: 'col-span-1 row-span-1',
    },
  },
  defaultVariants: {
    role: 'thumb',
  },
})

/* Place summary shared by the map popover and the mobile drawer — same content,
   two densities. */
export const placeSummary = tv({
  slots: {
    root: '',
    header: '',
    title: 'font-display leading-tight font-medium tracking-[-0.02em] text-ink',
    blurb: 'mt-4 font-sans text-stone-500',
  },
  variants: {
    density: {
      compact: {
        root: 'gap-2',
        title: 'text-[17px]',
        blurb: 'line-clamp-2 text-[13px] leading-snug',
      },
      roomy: {
        root: 'gap-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]',
        title: 'text-2xl',
        blurb: 'text-[15px] leading-relaxed',
      },
    },
  },
  defaultVariants: {
    density: 'roomy',
  },
})
