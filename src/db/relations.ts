import { defineRelations } from 'drizzle-orm'

import * as schema from './schema'

export const relations = defineRelations(schema, r => ({
  categories: {
    restaurant_categories: r.many.restaurant_categories({
      from: r.categories.id,
      to: r.restaurant_categories.category_id,
    }),
  },
  restaurants: {
    restaurant_categories: r.many.restaurant_categories({
      from: r.restaurants.id,
      to: r.restaurant_categories.restaurant_id,
    }),
    restaurant_external_data: r.one.restaurant_external_data({
      from: r.restaurants.id,
      to: r.restaurant_external_data.restaurant_id,
    }),
  },
  restaurant_categories: {
    categories: r.one.categories({
      from: r.restaurant_categories.category_id,
      to: r.categories.id,
      optional: false,
    }),
    restaurants: r.one.restaurants({
      from: r.restaurant_categories.restaurant_id,
      to: r.restaurants.id,
      optional: false,
    }),
  },
  restaurant_external_data: {
    restaurants: r.one.restaurants({
      from: r.restaurant_external_data.restaurant_id,
      to: r.restaurants.id,
      optional: false,
    }),
  },
}))
