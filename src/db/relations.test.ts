import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
// eslint-disable-next-line test/no-import-node-test -- Run with Node's test runner through tsx.
import { test } from 'node:test'

import { relations } from './relations'
import { categories, restaurant_categories, restaurant_external_data, restaurants } from './schema'

test('the existing-schema baseline preserves relations, nulls, and timestamp strings', async () => {
  const client = new PGlite()
  try {
    const baseline = readFileSync(new URL('../../drizzle/20261127155059_existing_schema/migration.sql', import.meta.url), 'utf8')
    // The captured baseline is commented out for existing databases. Only this
    // disposable in-memory PostgreSQL instance executes its creation statements.
    const creationSql = baseline.slice(baseline.indexOf('/*') + 2, baseline.lastIndexOf('*/'))
    await client.exec(creationSql)
    const db = drizzle({ client, relations })
    await db.insert(categories).values({ id: 11, slug: 'seafood', display_name: 'Seafood' })
    await db.insert(restaurants).values([
      { id: 21, slug: 'fixture-place', title: 'Fixture Place', formatted_data_updated: '2026-11-27 12:13:14.123' },
      { id: 22, slug: 'empty-place', title: 'Empty Place' },
    ])
    await db.insert(restaurant_categories).values({ restaurant_id: 21, category_id: 11 })
    await db.insert(restaurant_external_data).values({ restaurant_id: 21, google_place_id: 'fixture-google-id' })

    const place = await db.query.restaurants.findFirst({
      where: { slug: 'fixture-place' },
      with: {
        restaurant_categories: { with: { categories: true } },
        restaurant_external_data: true,
      },
    })
    assert.equal(place?.restaurant_categories[0]?.categories.slug, 'seafood')
    assert.equal(place?.restaurant_external_data?.google_place_id, 'fixture-google-id')
    assert.equal(place?.formatted_data_updated, '2026-11-27 12:13:14.123')
    assert.equal(place?.website, null)

    const empty = await db.query.restaurants.findFirst({
      where: { slug: 'empty-place' },
      with: { restaurant_categories: true, restaurant_external_data: true },
    })
    assert.deepEqual(empty?.restaurant_categories, [])
    assert.equal(empty?.restaurant_external_data, null)
  }
  finally {
    await client.close()
  }
})
