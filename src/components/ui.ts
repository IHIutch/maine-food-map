import { tv } from 'tailwind-variants'

export const button = tv({
  base: 'rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
  variants: {
    intent: {
      primary: 'bg-pine text-paper hover:bg-pine-deep',
      secondary: 'border border-ink/15 bg-white text-ink hover:bg-cream',
    },
  },
  defaultVariants: {
    intent: 'primary',
  },
})

export const metaLabel = tv({
  base: 'text-[11px] font-medium uppercase tracking-[0.14em]',
})

export const displayHeading = tv({
  base: 'font-display font-semibold tracking-tight text-ink',
})
