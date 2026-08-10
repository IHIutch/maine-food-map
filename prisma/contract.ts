import { defineContract, rel } from '@prisma/orm-postgres/contract-builder'

export const contract = defineContract({}, ({ field, model }) => {
  const Categories = model('categories', {
    fields: {
      id: field.int().defaultSql('autoincrement()').id(),
      slug: field.text(),
      display_name: field.text(),
      restaurant_count: field.int().optional().default(0),
    },
  })

  const Restaurants = model('restaurants', {
    fields: {
      id: field.int().defaultSql('autoincrement()').id(),
      slug: field.text(),
      title: field.text(),
      website: field.text().optional(),
      description: field.text().optional(),
      rating: field.float().optional(),
      review_count: field.int().optional(),
      rating_source: field.text().optional(),
      tags: field.text().optional(),
      photos: field.text().optional(),
      price_level: field.text().optional(),
      business_status: field.text().optional(),
      formatted_data_updated: field.temporal.timestamp(3).optional(),
      longitude: field.float().optional(),
      phone: field.text().optional(),
      opening_hours: field.text().optional(),
      address: field.text().optional(),
      latitude: field.float().optional(),
      street_address: field.text().optional(),
      state: field.text().optional(),
      city: field.text().optional(),
      postal_code: field.text().optional(),
    },
  })

  const RestaurantCategories = model('restaurant_categories', {
    fields: {
      restaurant_id: field.int(),
      category_id: field.int(),
    },
  })

  const RestaurantExternalData = model('restaurant_external_data', {
    fields: {
      restaurant_id: field.int().defaultSql('autoincrement()').id(),
      google_place_id: field.text().optional(),
      yelp_id: field.text().optional(),
      google_data: field.text().optional(),
      yelp_data: field.text().optional(),
      last_updated: field.temporal.timestamp(3).optional(),
    },
  })

  return {
    models: {
      categories: Categories.relations({
        restaurant_categories: rel.hasMany(RestaurantCategories, { by: 'category_id' }),
      }).sql(({ cols, constraints }) => ({
        table: 'categories',
        indexes: [
          constraints.index([cols.slug], { map: 'idx_category_slug' }),
          constraints.index([cols.slug], { map: 'sqlite_autoindex_categories_1', unique: true }),
        ],
      })),
      restaurant_categories: RestaurantCategories
        .relations({
          categories: rel.belongsTo(Categories, { from: 'category_id', to: 'id' }),
          restaurants: rel.belongsTo(Restaurants, { from: 'restaurant_id', to: 'id' }),
        })
        .attributes(({ fields, constraints }) => ({
          id: constraints.id([fields.restaurant_id, fields.category_id]),
        }))
        .sql(({ cols, constraints }) => ({
          table: 'restaurant_categories',
          indexes: [
            constraints.index([cols.category_id], { map: 'idx_restaurant_categories_category' }),
            constraints.index([cols.restaurant_id], { map: 'idx_restaurant_categories_restaurant' }),
          ],
          foreignKeys: [
            constraints.foreignKey(cols.category_id, Categories.refs.id),
            constraints.foreignKey(cols.restaurant_id, Restaurants.refs.id),
          ],
        })),
      restaurant_external_data: RestaurantExternalData
        .relations({
          restaurants: rel.belongsTo(Restaurants, { from: 'restaurant_id', to: 'id' }),
        })
        .sql({ table: 'restaurant_external_data' }),
      restaurants: Restaurants
        .relations({
          restaurant_categories: rel.hasMany(RestaurantCategories, { by: 'restaurant_id' }),
          restaurant_external_data: rel.hasOne(RestaurantExternalData, { by: 'restaurant_id' }),
        })
        .sql(({ cols, constraints }) => ({
          table: 'restaurants',
             indexes: [
               constraints.index([cols.slug], { map: 'idx_restaurant_slug' }),
               constraints.index([cols.slug], { map: 'sqlite_autoindex_restaurants_1', unique: true }),
             ],
        })),
    },
  }
})
