import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const rows = await prisma.restaurants.findMany({
    where: { public_id: null },
    select: { id: true, slug: true },
  })

  console.log(`Found ${rows.length} restaurants without public_id`)
  if (dryRun) {
    console.log('DRY RUN: no changes written')
    return
  }

  let updated = 0
  for (const row of rows) {
    let attempts = 0
    while (attempts < 5) {
      const candidate = nanoid(10)
      try {
        await prisma.restaurants.update({
          where: { id: row.id },
          data: { public_id: candidate },
        })
        updated++
        break
      } catch (err) {
        if (err?.code === 'P2002') {
          attempts++
          continue
        }
        throw err
      }
    }
    if (attempts === 5) {
      throw new Error(`Failed to generate unique public_id for restaurant ${row.id} after 5 attempts`)
    }
    if (updated % 50 === 0) console.log(`  ${updated}/${rows.length}`)
  }

  console.log(`Done. Assigned public_id to ${updated} restaurants.`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
