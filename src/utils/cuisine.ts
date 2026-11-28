/**
 * The `restaurant_categories` join table is empty. Match restaurant titles,
 * descriptions, and tags against category names and synonyms to derive cuisines.
 * The same matcher could later backfill the join table.
 */

export interface Category {
  slug: string
  display_name: string
}

/** Exclude non-cuisine categories from cuisine filters. */
const META_SLUGS = new Set([
  'grab-a-bite',
  'eat-out',
  'take-home',
  'nibble-and-sip',
  'non-edibles',
  'drinks',
  'classes',
  'organizations',
  'photography',
  'cooking-equipment',
  'book-stores',
  'delivery-services',
  'blogs',
  'variety-stores',
  'specialty-stores',
  'farms',
])

/** Words that imply a category when the category's own name never appears in the text. */
const SYNONYMS: Record<string, string[]> = {
  'seafood': ['lobster', 'oyster', 'clam', 'shellfish', 'haddock', 'chowder', 'scallop', 'crab', 'fish shack'],
  'oyster-bar': ['oyster', 'raw bar', 'shucking'],
  'fish-mongers': ['fish market', 'seafood market', 'lobsters'],
  'sushi-japanese': ['sushi', 'japanese', 'ramen', 'izakaya', 'sake', 'donburi'],
  'pizzerias': ['pizza', 'pizzeria', 'slices', 'neapolitan'],
  'bakeries': ['bakery', 'bake shop', 'pastries', 'croissant', 'bread', 'baked goods'],
  'coffee-houses': ['coffee', 'espresso', 'cafe', 'latte', 'roaster', 'coffeehouse'],
  'tea-shops': ['tea', 'matcha', 'boba'],
  'ice-cream-shops': ['ice cream', 'soft serve', 'sundae', 'frozen custard'],
  'gelato-shops': ['gelato', 'sorbet'],
  'doughnut-shops': ['doughnut', 'donut'],
  'candy-chocolate-shops': ['chocolate', 'chocolatier', 'candy', 'truffles', 'confections'],
  'breweries-distillers': ['brewery', 'brewing', 'distillery', 'distilling', 'taproom', 'ales', 'brews'],
  'beer-bars': ['beer', 'craft beer', 'pints'],
  'wine-bars': ['wine bar', 'natural wine', 'wine list'],
  'wine-beer-liquor': ['bottle shop', 'wine shop', 'liquor'],
  'cider': ['cider', 'ciders'],
  'cocktail-bars': ['cocktail', 'cocktails', 'mixology'],
  'pubs': ['pub', 'tavern', 'public house'],
  'sports-bars': ['sports bar'],
  'diners-sandwich-shops': ['diner', 'sandwich', 'sandwiches', 'panini', 'sub', 'grilled cheese', 'luncheonette'],
  'bagel-shops-grab-a-bite': ['bagel', 'bagels'],
  'food-trucks': ['food truck', 'truck serving'],
  'food-carts': ['food cart', 'street cart'],
  'mexican-latin-american': ['mexican', 'taco', 'tacos', 'burrito', 'arepas', 'empanada', 'empanadas', 'latin', 'peruvian', 'colombian', 'chilean'],
  'italian': ['italian', 'pasta', 'trattoria', 'osteria'],
  'american': ['new american', 'comfort food', 'burger', 'burgers', 'bar & grill', 'bar and grill'],
  'barbeque': ['barbecue', 'bbq', 'smoked brisket'],
  'fried-chicken': ['fried chicken', 'chicken fingers', 'chicken sandwich'],
  'wings': ['wings'],
  'steakhouse': ['steakhouse', 'steak house'],
  'thai': ['thai', 'pad thai', 'curry'],
  'vietnamese': ['vietnamese', 'banh mi', 'pho'],
  'chinese': ['chinese', 'dumplings', 'dim sum'],
  'korean': ['korean', 'kimchi'],
  'cambodian': ['cambodian'],
  'malaysian': ['malaysian'],
  'indian': ['indian', 'masala', 'tandoori'],
  'middle-eastern': ['middle eastern', 'falafel', 'shawarma', 'hummus', 'gyro', 'kebab', 'sambusa'],
  'mediterranean': ['mediterranean'],
  'greek': ['greek'],
  'french': ['french', 'bistro', 'escargot', 'kouign'],
  'german': ['german', 'schnitzel', 'potato pancakes'],
  'polish': ['polish', 'pierogi', 'pierogis'],
  'balkan': ['balkan'],
  'spanish': ['spanish', 'pintxos', 'paella'],
  'small-plate-tapas': ['tapas', 'small plates'],
  'cajun-creole': ['cajun', 'creole', 'po boy'],
  'african': ['african'],
  'nigerian': ['nigerian', 'suya'],
  'eritrean-ethiopian': ['ethiopian', 'eritrean', 'injera'],
  'jamaican': ['jamaican', 'jerk chicken'],
  'vegan': ['vegan', 'plant-based'],
  'poke': ['poke', 'poke bowl'],
  'juice-bars': ['juice', 'smoothie', 'smoothies', 'acai'],
  'ethnic-markets': ['market selling', 'grocery', 'halal', 'deli'],
  'super-markets': ['supermarket', 'grocery store'],
  'hotel-bars': ['hotel bar'],
  'gay-bars': ['gay bar', 'lgbtq'],
  'food-tours': ['tour', 'tours'],
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** One case-insensitive, word-boundary matcher per category. Built once per index. */
export function compileCuisineMatchers(categories: Category[]) {
  return categories
    .filter(category => !META_SLUGS.has(category.slug))
    .map((category) => {
      const phrases = [category.display_name, ...(SYNONYMS[category.slug] ?? [])]
      const pattern = phrases.map(phrase => escapeRegExp(phrase.toLowerCase().trim())).join('|')
      return {
        slug: category.slug,
        name: category.display_name,
        test: new RegExp(`\\b(?:${pattern})\\b`, 'i'),
      }
    })
}

export type CuisineMatcher = ReturnType<typeof compileCuisineMatchers>[number]

/**
 * Cuisines a place matches, most-confident first: what its name says about it
 * beats what its blurb happens to mention, so "Luke's Lobster" reads as Seafood
 * rather than picking up Beer Bars from a passing mention of beer.
 */
export function deriveCuisineSlugs({ title, blurb }: { title: string, blurb: string }, matchers: CuisineMatcher[]) {
  const fromTitle: string[] = []
  const fromBlurb: string[] = []
  for (const matcher of matchers) {
    if (matcher.test.test(title))
      fromTitle.push(matcher.slug)
    else if (matcher.test.test(blurb))
      fromBlurb.push(matcher.slug)
  }
  return [...fromTitle, ...fromBlurb]
}
