import postgres from '@prisma/orm-postgres/runtime'
import process from 'node:process'

import type { Contract } from './contract.d'

import contractJson from './contract.json' with { type: 'json' }
import { getDatabaseUrl } from './database-url'

async function createDb() {
  const url = getDatabaseUrl(process.env)

  const db = postgres<Contract>({
    contractJson,
    url,
    poolOptions: {
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 1000,
    },
  })
  try {
    await db.connect()
    return db
  }
  catch (error) {
    await db.close().catch(() => undefined)
    throw error
  }
}

type PrismaDb = Awaited<ReturnType<typeof createDb>>

export async function withDb<T>(callback: (db: PrismaDb) => Promise<T>) {
  const db = await createDb()

  try {
    return await callback(db)
  }
  finally {
    await db.close()
  }
}
