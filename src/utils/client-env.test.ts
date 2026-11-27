import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- Run with Node's test runner through tsx.
import { test } from 'node:test'

import { clientEnvSchema } from './client-env'

test('production client configuration does not require a local development port', () => {
  assert.deepEqual(clientEnvSchema.parse({ VITE_MAPBOX_API_KEY: 'test-key' }), {
    VITE_MAPBOX_API_KEY: 'test-key',
    VITE_PORT: '3000',
  })
})

test('client configuration preserves an explicit development port', () => {
  assert.equal(clientEnvSchema.parse({ VITE_MAPBOX_API_KEY: 'test-key', VITE_PORT: '4321' }).VITE_PORT, '4321')
})

test('client configuration still requires the Mapbox key', () => {
  assert.equal(clientEnvSchema.safeParse({}).success, false)
})
