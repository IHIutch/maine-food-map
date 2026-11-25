import { defineConfig } from '@prisma/orm-postgres/config'
import 'dotenv/config'
import process from 'node:process'
import { definePrismaConfig } from 'prisma/config'

import { getDatabaseUrl } from './prisma/database-url'

// prisma 8 config
export default definePrismaConfig({
  orm: defineConfig({
    contract: './prisma/contract.ts',
    db: {
      connection: getDatabaseUrl(process.env),
    },
  }),
})
