import { tv } from 'tailwind-variants'

/* Pill button: primary(ink) / secondary(ghost) / accent(coral CTA) / paper(on-dark) */
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
  base: 'font-mono text-[11px] font-medium tracking-[0.14em] text-ink-soft uppercase',
  variants: {
    bar: {
      true: 'inline-flex items-center gap-2.5 before:h-0.5 before:w-7 before:bg-accent before:content-[\'\']',
    },
  },
})

/* Mono section title with hairline rule */
export const sectionTitle = tv({
  base: 'mb-5 border-b border-ink/15 pb-2.5 font-mono text-[11px] font-medium tracking-[0.14em] text-ink-soft uppercase',
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
  base: 'inline-flex items-center rounded-full border border-ink/15 bg-paper px-2 py-1 font-sans text-xs font-medium',
})

/* Filter pill / segmented control */
export const pillFilter = tv({
  base: 'rounded-full border px-3.5 py-[7px] font-sans text-[13px] leading-none font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  variants: {
    active: {
      true: 'border-ink bg-ink text-paper',
      false: 'border-ink/20 bg-paper text-ink hover:bg-cream',
    },
  },
  defaultVariants: {
    active: false,
  },
})

/* Rounded input */
export const input = tv({
  base: 'w-full rounded-lg border border-ink/20 bg-paper px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none',
  variants: {
    onDark: {
      true: 'border-paper/30 bg-transparent text-paper placeholder:text-paper/50 focus:border-paper',
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
  base: 'underline underline-offset-4 transition-colors',
  variants: {
    tone: {
      ink: 'text-ink decoration-ink/30 hover:decoration-ink',
      accent: 'text-accent-deep decoration-accent/40 hover:decoration-accent-deep',
      paper: 'text-paper decoration-paper/40 hover:decoration-paper',
    },
  },
  defaultVariants: {
    tone: 'accent',
  },
})

/* Top-nav link with animated underline */
export const navLink = tv({
  base: 'relative py-1.5 font-sans text-[13.5px] text-ink no-underline after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 after:content-[\'\'] hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  variants: {
    active: {
      true: 'after:scale-x-100',
    },
  },
})

/* Footer nav item — plain, paper-on-ink */
export const footerLink = tv({
  base: 'text-[15px] text-paper/80 transition-colors hover:text-paper',
})

/* Mono caps meta line joined with middots */
export const metaRow = tv({
  base: 'flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[11px] font-medium tracking-[0.1em] uppercase',
})
