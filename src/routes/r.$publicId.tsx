import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'

const resolveSlug = createServerFn({ method: 'GET' })
  .inputValidator((d: { publicId: string }) => d)
  .handler(async ({ data }) => {
    const restaurant = await prisma.restaurants.findUnique({
      where: { public_id: data.publicId },
      select: { slug: true },
      cacheStrategy: { ttl: 3600 },
    })
    if (!restaurant) {
      throw new Error('Restaurant not found')
    }
    return restaurant.slug
  })

export const Route = createFileRoute('/r/$publicId')({
  loader: async ({ params }) => {
    const slug = await resolveSlug({ data: { publicId: params.publicId } })
    throw redirect({
      to: '/places/$slug',
      params: { slug },
      statusCode: 301,
    })
  },
})
