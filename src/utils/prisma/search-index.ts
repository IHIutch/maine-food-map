import { withDb } from '../prisma'

/**
 * Everything the command palette needs, in two queries. Mirrors the filters used
 * by the places list so a palette result never points at a place the list hides.
 */
export function prismaGetSearchIndex() {
  return withDb(async db => ({
    restaurants: await db.orm.public.restaurants
      .where(restaurant => restaurant.rating.isNotNull())
      .where(restaurant => restaurant.state.eq('ME'))
      .where(restaurant => restaurant.longitude.isNotNull())
      .where(restaurant => restaurant.latitude.isNotNull())
      .select('id', 'slug', 'title', 'description', 'city', 'tags', 'price_level', 'rating', 'opening_hours')
      .orderBy([restaurant => restaurant.rating.desc(), restaurant => restaurant.title.asc()])
      .all(),
    categories: await db.orm.public.categories
      .select('slug', 'display_name')
      .all(),
  }))
}
