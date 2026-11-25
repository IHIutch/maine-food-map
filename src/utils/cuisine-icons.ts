/**
 * A pin can carry an idea, not a taxonomy — so the ~78 categories collapse into
 * a handful of shapes someone can read at a glance on a map.
 */
const CUISINE_ICONS: { match: string[], icon: string }[] = [
  { match: ['seafood', 'oyster', 'fish'], icon: 'icon-[material-symbols--set-meal-rounded]' },
  { match: ['coffee', 'tea', 'juice'], icon: 'icon-[material-symbols--local-cafe-rounded]' },
  { match: ['breweries', 'beer', 'pubs', 'bars', 'wine', 'cider'], icon: 'icon-[material-symbols--sports-bar-rounded]' },
  { match: ['bakeries', 'doughnut', 'candy', 'ice-cream', 'gelato'], icon: 'icon-[material-symbols--bakery-dining-rounded]' },
  { match: ['pizzerias'], icon: 'icon-[material-symbols--local-pizza-rounded]' },
  { match: ['food-trucks', 'food-carts'], icon: 'icon-[material-symbols--local-shipping-rounded]' },
  { match: ['markets', 'grocery', 'specialty'], icon: 'icon-[material-symbols--storefront-rounded]' },
]

const FALLBACK_ICON = 'icon-[material-symbols--restaurant-rounded]'

export function cuisineIconFor(cuisineSlugs: string[] | undefined) {
  for (const entry of CUISINE_ICONS) {
    if (cuisineSlugs?.some(slug => entry.match.some(needle => slug.includes(needle))))
      return entry.icon
  }
  return FALLBACK_ICON
}
