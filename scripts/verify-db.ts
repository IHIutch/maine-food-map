import 'dotenv/config'
import assert from 'node:assert/strict'

import { findFirstBySlug, findNearest, getRestaurantList, getSitemapRestaurants } from '../src/db/queries/restaurants'

// Reads only. Run explicitly against the database configured in the environment.
const list = await getRestaurantList()
const sitemap = await getSitemapRestaurants()
assert.ok(sitemap.length >= list.length)
assert.equal(await findFirstBySlug({ slug: '__drizzle_migration_missing_place__' }), null)

const place = list[0]
if (place) {
  const detail = await findFirstBySlug({ slug: place.slug })
  assert.equal(detail?.id, place.id)
  assert.ok(Array.isArray(detail?.restaurant_categories))
  if (place.latitude != null && place.longitude != null) {
    const nearby = await findNearest({ id: place.id, latitude: place.latitude, longitude: place.longitude })
    assert.ok(nearby.every(row => row.id !== place.id))
    assert.ok(nearby.every((row, index) => index === 0 || row.distanceMiles >= nearby[index - 1].distanceMiles))
  }
}

console.log(`Connected: ${list.length} listed places, ${sitemap.length} sitemap entries; detail, relation, nearby and missing-place reads passed.`)
