import 'dotenv/config';
import { defineConfig } from '@prisma/orm-postgres/config';

// prisma 8 ("next") config
export default defineConfig({
  contract: './prisma/contract.ts',
  db: {
    connection: (process.env['DATABASE_URL'])!,
  },
});
