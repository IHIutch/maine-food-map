import { tv } from 'tailwind-variants'

/* Pill button: primary(ink) / secondary(ghost) / accent(coral CTA) / paper(on-dark) */
export const button = tv({
  base: 'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 font-sans text-[13px] font-medium leading-none transition-colors active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
  variants: {
    intent: {
      primary: 'border border-ink bg-ink text-paper hover:bg-pine-deep hover:border-pine-deep',
      secondary: 'border border-ink/20 bg-transparent text-ink hover:border-ink hover:bg-cream',
      accent: 'border border-accent bg-accent text-white hover:bg-accent-deep hover:border-accent-deep',
      paper: 'border border-paper bg-paper text-ink hover:bg-cream focus-visible:outline-paper',
    },
  },
  defaultVariants: {
    intent: 'primary',
  },
})

/* Mono caps micro-label (DM Mono) */
export const metaLabel = tv({
  base: 'font-mono text-[11px] font-medium uppercase tracking-[0.12em]',
})

/* Eyebrow — mono caps, optionally led by a short accent bar */
export const eyebrow = tv({
  base: 'font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft',
  variants: {
    bar: {
      true: "inline-flex items-center gap-2.5 before:h-0.5 before:w-7 before:bg-accent before:content-['']",
    },
  },
})

/* Mono section title with hairline rule */
export const sectionTitle = tv({
  base: 'font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink-soft border-b border-ink/15 pb-2.5 mb-5',
})

/* Editorial serif — soft terminals, tight leading */
export const displayHeading = tv({
  base: 'font-display font-medium leading-[0.95] tracking-[-0.02em] text-ink',
})

/* Italic display lede/blurb */
export const lede = tv({
  base: 'font-display italic font-normal leading-[1.4] text-ink',
})

/* Pill tags: plain / price(mono, hairline) / status(dot: pine=open, tomato=closed) */
export const tag = tv({
  base: 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-[11.5px] font-medium leading-normal tracking-[0.04em]',
  variants: {
    intent: {
      plain: 'bg-cream text-ink',
      price: 'border border-ink/15 bg-paper font-mono text-ink',
      status: "before:size-1.5 before:rounded-full before:content-['']",
    },
    open: {
      true: 'bg-paper text-ink before:bg-pine',
      false: 'border border-ink/15 text-ink-soft before:bg-tomato',
    },
  },
  defaultVariants: {
    intent: 'plain',
  },
})

/* Filter pill / segmented control */
export const pillFilter = tv({
  base: 'rounded-full border px-3.5 py-[7px] font-sans text-[13px] font-medium leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
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
  base: 'w-full rounded-lg border border-ink/20 bg-paper px-3.5 py-2.5 font-sans text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-ink',
  variants: {
    onDark: {
      true: 'border-paper/30 bg-transparent text-paper placeholder:text-paper/50 focus:border-paper',
    },
  },
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
  base: "relative py-1.5 font-sans text-[13.5px] text-ink no-underline after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 after:content-[''] hover:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
  variants: {
    active: {
      true: 'after:scale-x-100',
    },
  },
})

/* Mono caps meta line joined with middots */
export const metaRow = tv({
  base: 'flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em]',
})
