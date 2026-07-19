import { tv } from 'tailwind-variants'

/* Square print-shop button: uppercase, tracked, hard edges */
export const button = tv({
  base: 'inline-block rounded-none px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry',
  variants: {
    intent: {
      primary: 'bg-blueberry text-paper hover:bg-blueberry-deep',
      secondary: 'border border-ink/25 bg-transparent text-ink hover:bg-cream',
      paper: 'bg-paper text-pine-deep hover:bg-cream',
    },
  },
  defaultVariants: {
    intent: 'primary',
  },
})

/* Utility caps micro-label (Inter) */
export const metaLabel = tv({
  base: 'text-[11px] font-medium uppercase tracking-[0.14em]',
})

/* Lapidary caps (Cinzel) — wordmark, mastheads, section eyebrows. Use sparingly. */
export const brandCaps = tv({
  base: 'font-brand font-normal uppercase tracking-[0.08em] text-ink',
})

/* Editorial serif — light weight, tight leading, soft terminals */
export const displayHeading = tv({
  base: 'font-display font-light leading-[0.95] tracking-tight text-ink',
})

/* Caps meta line joined with middots: ● OPEN · SEAFOOD · WINE BAR */
export const metaRow = tv({
  base: 'flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em]',
})

/* Status dot + caps word, LocalFinds-style */
export const statusMark = tv({
  base: "inline-flex items-baseline gap-1.5 before:content-['●'] before:text-[8px]",
  variants: {
    open: {
      true: 'text-pine before:text-pine',
      false: 'text-tomato before:text-tomato',
    },
  },
})

/* Square segmented control (list/map toggle) */
export const toggleSegment = tv({
  base: 'rounded-none px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueberry',
  variants: {
    active: {
      true: 'bg-ink text-paper',
      false: 'border border-ink/25 text-ink hover:bg-cream',
    },
  },
})

/* Square input */
export const input = tv({
  base: 'w-full rounded-none border border-ink/25 bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60 focus:outline-2 focus:outline-offset-2 focus:outline-blueberry',
  variants: {
    onDark: {
      true: 'border-paper/30 bg-transparent text-paper placeholder:text-paper/50 focus:outline-paper',
    },
  },
})
