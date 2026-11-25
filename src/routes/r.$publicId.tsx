import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { prisma } from '../utils/prisma'
import * as z from 'zod'

const resolveSlug = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ publicId: z.string().min(1).max(40) }).parse)
  .handler(async ({ data }) => {
    const restaurant = await prisma.restaurants.findUnique({
      where: { public_id: data.publicId },
      select: { slug: true },
      cacheStrategy: { ttl: 3600 },
    })
    if (!restaurant) {
      throw notFound()
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
