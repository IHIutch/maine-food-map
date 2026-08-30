import 'dotenv/config'
import { defineConfig } from '@prisma/orm-postgres/config'
import { definePrismaConfig } from 'prisma/config'

// prisma 8 config
export default definePrismaConfig({
  orm: defineConfig({
    contract: './prisma/contract.ts',
    db: {
      connection: (process.env.DATABASE_URL)!,
    },
  }),
})
