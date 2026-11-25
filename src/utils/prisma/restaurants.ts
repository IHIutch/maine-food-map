import { withDb } from '../prisma'

export function prismaGetRestaurants() {
  return withDb(async db =>
    await db.orm.public.restaurants
      .where(restaurant => restaurant.rating.isNotNull())
      .where(restaurant => restaurant.state.eq('ME'))
      .where(restaurant => restaurant.longitude.isNotNull())
      .where(restaurant => restaurant.latitude.isNotNull())
      .select(
        'id',
        'slug',
        'title',
        'description',
        'rating',
        'review_count',
        'city',
        'tags',
        'opening_hours',
        'latitude',
        'longitude',
        'price_level',
      )
      .orderBy([restaurant => restaurant.rating.desc(), restaurant => restaurant.title.asc()])
      .all(),
  )
}

export async function findFirstBySlug({ slug }: { slug: string }) {
  return await withDb(async db =>
    await db.orm.public.restaurants
      .include('restaurant_categories', restaurantCategories =>
        restaurantCategories.include('categories'))
      .first({ slug }),
  )
}

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180
}

const EARTH_RADIUS_MILES = 3958.8

function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function findNearest({ id, latitude, longitude, limit = 3 }: {
  id: number
  latitude: number
  longitude: number
  limit?: number
}) {
  const restaurants = await withDb(async db =>
    await db.orm.public.restaurants
      .where(restaurant => restaurant.id.neq(id))
      .where(restaurant => restaurant.state.eq('ME'))
      .where(restaurant => restaurant.latitude.isNotNull())
      .where(restaurant => restaurant.longitude.isNotNull())
      .select('id', 'slug', 'title', 'city', 'latitude', 'longitude', 'rating', 'price_level', 'tags', 'description')
      .all(),
  )

  // The query already excludes null coordinates, but the generated types don't
  // know that. Bailing inside flatMap narrows them by plain control flow — a
  // filter() predicate can't, since narrowing a property doesn't narrow the row.
  return restaurants
    .flatMap((restaurant) => {
      const { latitude: lat, longitude: lng } = restaurant
      if (lat == null || lng == null)
        return []
      return [{
        ...restaurant,
        distanceMiles: haversineDistanceMiles(latitude, longitude, lat, lng),
      }]
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, limit)
}
