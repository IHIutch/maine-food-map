/**
 * What people type when they don't type the category name.
 *
 * Three kinds of entry, all keyed by `categories.slug`:
 *   1. acronyms and initialisms   — bbq, kbbq, ipa, ayce
 *   2. shorthand and slang        — mex, viet, za, sammies, caff
 *   3. dish names that stand in for a cuisine — pho, gyro, birria, omakase
 *
 * These are query-side only: a person typing "bbq" means it, whereas "bbq"
 * appearing in a blurb is weaker evidence — so cuisine *derivation* keeps its own,
 * more conservative synonym list in `cuisine.ts`.
 */
export const CUISINE_ALIASES: Record<string, string[]> = {
  'barbeque': ['bbq', 'b-b-q', 'barbecue', 'smokehouse', 'brisket', 'pulled pork'],
  'korean': ['kbbq', 'k-bbq', 'korean bbq', 'bibimbap', 'kimchi', 'bulgogi'],
  'breweries-distillers': ['ipa', 'neipa', 'apa', 'dipa', 'abv', 'brewpub', 'taproom', 'craft beer', 'sour', 'stout'],
  'beer-bars': ['ipa', 'pints', 'on tap', 'draft', 'draught'],
  'wine-bars': ['byob', 'natty wine', 'orange wine', 'somm'],
  'wine-beer-liquor': ['byob', 'bottle shop', 'package store', 'redemption'],
  'cocktail-bars': ['zero proof', 'mocktail', 'happy hour', 'nightcap'],
  'seafood': ['lobstah', 'lobster roll', 'fish and chips', 'fish n chips', 'f&c', 'steamers', 'fried clams', 'chowdah', 'shore dinner'],
  'oyster-bar': ['raw bar', 'oysters', 'shucked', 'bivalves'],
  'fish-mongers': ['fish market', 'seafood counter'],
  'pizzerias': ['za', 'pie', 'slice shop', 'ny slice', 'neapolitan', 'sicilian', 'apizza'],
  'diners-sandwich-shops': ['blt', 'blts', 'sammie', 'sammies', 'sub', 'subs', 'hoagie', 'italian sandwich', 'melt', 'greasy spoon'],
  'bagel-shops-grab-a-bite': ['bec', 'bacon egg and cheese', 'everything bagel', 'lox', 'schmear'],
  'coffee-houses': ['caff', 'cortado', 'flat white', 'cold brew', 'pour over', 'third wave'],
  'tea-shops': ['boba', 'bubble tea', 'chai'],
  'juice-bars': ['acai', 'smoothie bowl', 'cold pressed'],
  'ice-cream-shops': ['soft serve', 'sundae', 'creemee', 'frappe'],
  'doughnut-shops': ['donuts', 'apple cider donut'],
  'mexican-latin-american': ['mex', 'tex mex', 'tex-mex', 'birria', 'al pastor', 'taqueria', 'elote', 'horchata'],
  'italian': ['red sauce', 'cacio e pepe', 'aperitivo', 'nonna'],
  'vietnamese': ['viet', 'pho', 'banh mi', 'bun cha', 'ca phe'],
  'chinese': ['dim sum', 'hot pot', 'szechuan', 'sichuan', 'general tso', 'lo mein'],
  'sushi-japanese': ['omakase', 'nigiri', 'maki', 'izakaya', 'donburi', 'katsu', 'udon'],
  'thai': ['pad thai', 'pad see ew', 'tom yum', 'khao soi'],
  'indian': ['ttm', 'tikka masala', 'thali', 'dosa', 'naan', 'curry house'],
  'middle-eastern': ['shawarma', 'falafel', 'za\'atar', 'mezze', 'labneh'],
  'mediterranean': ['med', 'mezze'],
  'greek': ['gyro', 'gyros', 'souvlaki', 'spanakopita'],
  'french': ['bistro', 'brasserie', 'patisserie', 'prix fixe', 'steak frites'],
  'german': ['biergarten', 'brat', 'brats', 'schnitzel'],
  'polish': ['pierogi', 'pierogies', 'kielbasa'],
  'spanish': ['tapas', 'paella', 'pintxos', 'jamon'],
  'cajun-creole': ['po boy', 'po\'boy', 'poboy', 'gumbo', 'jambalaya', 'etouffee'],
  'eritrean-ethiopian': ['injera', 'tibs', 'doro wat'],
  'nigerian': ['suya', 'jollof', 'egusi'],
  'jamaican': ['jerk', 'jerk chicken', 'oxtail', 'patty'],
  'cambodian': ['num pang', 'amok'],
  'malaysian': ['laksa', 'roti canai'],
  'balkan': ['cevapi', 'burek'],
  'american': ['comfort food', 'new american', 'burg', 'smash burger', 'brunch', 'meat and three'],
  'steakhouse': ['ribeye', 'dry aged', 'porterhouse', 'surf and turf'],
  'fried-chicken': ['hot chicken', 'chicken sammie', 'tenders'],
  'wings': ['bdubs', 'buffalo wings', 'flats and drums'],
  'vegan': ['plant based', 'vegetarian', 'veg', 'vgn'],
  'poke': ['poke bowl', 'ahi'],
  'small-plate-tapas': ['tapas', 'small plates', 'shareables'],
  'bakeries': ['laminated', 'kouign', 'croiss', 'sourdough', 'morning bun'],
  'candy-chocolate-shops': ['bonbons', 'truffles', 'fudge'],
  'food-trucks': ['truck', 'roach coach', 'street food'],
  'food-carts': ['cart', 'street food'],
  'ethnic-markets': ['halal', 'bodega', 'international market', 'asian market'],
  'super-markets': ['groceries', 'grocery run'],
  'pubs': ['dive', 'dive bar', 'local', 'watering hole'],
  'sports-bars': ['game day', 'big screen'],
  'farms': ['csa', 'farm stand', 'pick your own', 'pyo', 'u-pick'],
  'food-tours': ['walking tour'],
  'cider': ['hard cider', 'orchard'],
  'gelato-shops': ['sorbetto', 'stracciatella'],
  'delivery-services': ['takeout', 'to go', 'curbside'],
}

/** Generic shorthand that isn't a cuisine but tells us how someone wants to eat. */
export const INTENT_ALIASES: Record<string, string[]> = {
  'take-home': ['ayce', 'to go', 'takeout', 'take out', 'takeaway'],
  'grab-a-bite': ['quick bite', 'counter serve', 'grab and go'],
  'eat-out': ['sit down', 'date night', 'dine in'],
}

const LOOKUP = (() => {
  const byAlias = new Map<string, string[]>()
  for (const [slug, aliases] of Object.entries(CUISINE_ALIASES)) {
    for (const alias of aliases) {
      const key = alias.toLowerCase()
      byAlias.set(key, [...(byAlias.get(key) ?? []), slug])
    }
  }
  return byAlias
})()

/**
 * Extra search terms implied by a query — "bbq" also searches Barbeque, "pho"
 * also searches Vietnamese. Returns canonical category slugs, most specific first.
 */
export function aliasSlugsFor(query: string): { slug: string, exact: boolean }[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2)
    return []

  const found = new Map<string, boolean>()
  for (const [alias, matched] of LOOKUP) {
    // typing the shorthand outright is a deliberate signal; a partial overlap is a hint
    const exact = alias === needle
    if (!exact && !needle.includes(alias) && !alias.startsWith(needle))
      continue
    for (const slug of matched)
      found.set(slug, (found.get(slug) ?? false) || exact)
  }
  return [...found].map(([slug, exact]) => ({ slug, exact }))
}
