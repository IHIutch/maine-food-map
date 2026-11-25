import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- Run with Node's test runner through tsx.
import { test } from 'node:test'

import { getDatabaseUrl } from './database-url'

const direct = 'postgresql://user:password@localhost:5432/food'

test('prefers the direct URL over a legacy Accelerate URL', () => {
  assert.equal(getDatabaseUrl({ DATABASE_URL: 'prisma://accelerate.example/?api_key=test', DIRECT_DATABASE_URL: direct }), direct)
})

test('accepts a direct URL without DATABASE_URL', () => {
  assert.equal(getDatabaseUrl({ DIRECT_DATABASE_URL: direct }), direct)
})

test('accepts DATABASE_URL when it already uses direct Postgres', () => {
  assert.equal(getDatabaseUrl({ DATABASE_URL: direct }), direct)
})

test('rejects missing and legacy-only connection URLs without exposing credentials', () => {
  assert.throws(() => getDatabaseUrl({}), /Missing database connection URL/)
  assert.throws(() => getDatabaseUrl({ DATABASE_URL: 'prisma://accelerate.example/?api_key=private-test-key' }), {
    message: 'A direct postgres:// or postgresql:// connection URL is required',
  })
})
