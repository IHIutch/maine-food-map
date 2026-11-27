import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'
import process from 'node:process'

import { getDatabaseUrl } from './src/db/database-url'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  introspect: { casing: 'preserve' },
  schemaFilter: ['public'],
  tablesFilter: ['categories', 'restaurant_categories', 'restaurant_external_data', 'restaurants'],
  ...(process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL
    ? { dbCredentials: { url: getDatabaseUrl(process.env) } }
    : {}),
})
