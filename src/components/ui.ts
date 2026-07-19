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

export const card = tv({
  base: 'rounded-2xl bg-white ring-1 ring-ink/10',
  variants: {
    interactive: {
      true: 'hover:shadow-lg hover:-translate-y-0.5 transition',
    },
  },
})

export const chip = tv({
  base: 'rounded-full px-2.5 py-1 text-xs font-medium',
  variants: {
    tone: {
      sage: 'bg-sage-tint text-pine',
      paper: 'bg-paper/70 text-pine px-3 py-1',
      plum: 'bg-plum-tint text-plum px-3 py-1',
    },
  },
  defaultVariants: {
    tone: 'sage',
  },
})

export const statusPill = tv({
  base: 'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
  variants: {
    open: {
      true: 'bg-sage-tint text-pine',
      false: 'bg-tomato-tint text-tomato',
    },
    solid: {
      true: '',
    },
  },
  compoundVariants: [
    { open: true, solid: true, className: 'bg-pine text-paper' },
    { open: false, solid: true, className: 'bg-tomato text-paper' },
  ],
})

export const togglePill = tv({
  base: 'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
  variants: {
    active: {
      true: 'bg-pine text-paper',
      false: 'bg-cream text-ink hover:bg-sage-tint',
    },
  },
})
