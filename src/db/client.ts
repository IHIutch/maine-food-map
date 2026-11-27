import { drizzle } from 'drizzle-orm/node-postgres'
import process from 'node:process'
import { Client } from 'pg'

import { getDatabaseUrl } from './database-url'
import { relations } from './relations'

function createDatabase(client: Client) {
  return drizzle({ client, relations })
}

type Database = ReturnType<typeof createDatabase>

// A connection belongs to this operation, never to another Worker request.
export async function withDb<T>(callback: (db: Database) => Promise<T>) {
  const client = new Client({
    connectionString: getDatabaseUrl(process.env),
    connectionTimeoutMillis: 5000,
  })
  try {
    await client.connect()
    return await callback(createDatabase(client))
  }
  finally {
    await client.end()
  }
}
