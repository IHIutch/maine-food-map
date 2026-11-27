import * as z from 'zod'

const restaurantPhotoSchema = z.object({
  url: z.string().optional(),
})

const openingHourSchema = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string(),
  close: z.string(),
})

const categorySchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  display_name: z.string(),
  restaurant_count: z.number().int().nullable(),
})

function jsonArray<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess((value) => {
    if (typeof value === 'string')
      return JSON.parse(value)
    return value ?? []
  }, z.array(schema))
}

function jsonNullableArray<T extends z.ZodTypeAny>(schema: T) {
  return z.preprocess(value => (typeof value === 'string' ? JSON.parse(value) : value), z.array(schema).nullish())
}

export const restaurantSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  website: z.string().nullish(),
  description: z.string().nullish(),
  rating: z.number().nullish(),
  review_count: z.number().int().nullish(),
  rating_source: z.string().nullish(),
  photos: jsonArray(restaurantPhotoSchema),
  price_level: z.string().nullish(),
  business_status: z.string().nullish(),
  phone: z.string().nullish(),
  opening_hours: jsonNullableArray(openingHourSchema),
  address: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  street_address: z.string().nullish(),
  state: z.string().nullish(),
  city: z.string().nullish(),
  postal_code: z.string().nullish(),
  tags: jsonArray(z.string()),
  restaurant_categories: z.array(z.object({
    categories: categorySchema,
  })).nullish(),
})

export type RestaurantSchema = z.infer<typeof restaurantSchema>
