import { and, asc, desc, eq, isNotNull, ne } from 'drizzle-orm'

import { withDb } from '../client'
import { restaurants } from '../schema'

export function getRestaurantList() {
  return withDb(db => db.select({
    id: restaurants.id,
    slug: restaurants.slug,
    title: restaurants.title,
    description: restaurants.description,
    rating: restaurants.rating,
    review_count: restaurants.review_count,
    city: restaurants.city,
    tags: restaurants.tags,
    opening_hours: restaurants.opening_hours,
    latitude: restaurants.latitude,
    longitude: restaurants.longitude,
    price_level: restaurants.price_level,
  }).from(restaurants).where(and(
    isNotNull(restaurants.rating),
    eq(restaurants.state, 'ME'),
    isNotNull(restaurants.longitude),
    isNotNull(restaurants.latitude),
  )).orderBy(desc(restaurants.rating), asc(restaurants.title)))
}

export async function findFirstBySlug({ slug }: { slug: string }) {
  return withDb(async db => (await db.query.restaurants.findFirst({
    where: { slug },
    // Keep the route's existing result shape; public_id was absent from its Prisma contract.
    columns: { public_id: false },
    with: { restaurant_categories: { with: { categories: true } } },
  })) ?? null)
}

export function getSitemapRestaurants() {
  return withDb(db => db.select({
    slug: restaurants.slug,
    formatted_data_updated: restaurants.formatted_data_updated,
  }).from(restaurants).orderBy(desc(restaurants.formatted_data_updated)))
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
  const places = await withDb(db => db.select({
    id: restaurants.id,
    slug: restaurants.slug,
    title: restaurants.title,
    city: restaurants.city,
    latitude: restaurants.latitude,
    longitude: restaurants.longitude,
    rating: restaurants.rating,
    price_level: restaurants.price_level,
    tags: restaurants.tags,
    description: restaurants.description,
  }).from(restaurants).where(and(
    ne(restaurants.id, id),
    eq(restaurants.state, 'ME'),
    isNotNull(restaurants.latitude),
    isNotNull(restaurants.longitude),
  )))

  return places
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
