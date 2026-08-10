import 'dotenv/config'

const { withDb } = await import('../prisma/db')

const restaurant = await withDb(async (db) => await db.orm.public.restaurants.first())

console.log(
  restaurant
    ? `✅ Connected — read restaurant ${restaurant.id}`
    : '✅ Connected — restaurants table is empty',
)
