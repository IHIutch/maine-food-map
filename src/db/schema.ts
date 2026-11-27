import { doublePrecision, foreignKey, index, integer, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const categories = pgTable('categories', {
  id: serial().primaryKey(),
  slug: text().notNull(),
  display_name: text().notNull(),
  restaurant_count: integer().default(0),
}, table => [
  index('idx_category_slug').using('btree', table.slug.asc().nullsLast()),
  uniqueIndex('sqlite_autoindex_categories_1').using('btree', table.slug.asc().nullsLast()),
])

export const restaurants = pgTable('restaurants', {
  id: serial().primaryKey(),
  slug: text().notNull(),
  title: text().notNull(),
  website: text(),
  description: text(),
  rating: doublePrecision(),
  review_count: integer(),
  rating_source: text(),
  tags: text(),
  photos: text(),
  price_level: text(),
  business_status: text(),
  formatted_data_updated: timestamp({ precision: 3, mode: 'string' }),
  longitude: doublePrecision(),
  phone: text(),
  opening_hours: text(),
  address: text(),
  latitude: doublePrecision(),
  street_address: text(),
  state: text(),
  city: text(),
  postal_code: text(),
  public_id: text(),
}, table => [
  index('idx_restaurant_public_id').using('btree', table.public_id.asc().nullsLast()),
  index('idx_restaurant_slug').using('btree', table.slug.asc().nullsLast()),
  uniqueIndex('restaurants_public_id_key').using('btree', table.public_id.asc().nullsLast()),
  uniqueIndex('sqlite_autoindex_restaurants_1').using('btree', table.slug.asc().nullsLast()),
])
export const restaurant_categories = pgTable('restaurant_categories', {
  restaurant_id: integer().notNull(),
  category_id: integer().notNull(),
}, table => [
  primaryKey({ columns: [table.restaurant_id, table.category_id], name: 'restaurant_categories_pkey' }),
  foreignKey({
    columns: [table.category_id],
    foreignColumns: [categories.id],
    name: 'restaurant_categories_category_id_fkey',
  }),
  foreignKey({
    columns: [table.restaurant_id],
    foreignColumns: [restaurants.id],
    name: 'restaurant_categories_restaurant_id_fkey',
  }),
  index('idx_restaurant_categories_category').using('btree', table.category_id.asc().nullsLast()),
  index('idx_restaurant_categories_restaurant').using('btree', table.restaurant_id.asc().nullsLast()),
])

export const restaurant_external_data = pgTable('restaurant_external_data', {
  restaurant_id: serial().primaryKey(),
  google_place_id: text(),
  yelp_id: text(),
  google_data: text(),
  yelp_data: text(),
  last_updated: timestamp({ precision: 3, mode: 'string' }),
}, table => [
  foreignKey({
    columns: [table.restaurant_id],
    foreignColumns: [restaurants.id],
    name: 'restaurant_external_data_restaurant_id_fkey',
  }),
])
