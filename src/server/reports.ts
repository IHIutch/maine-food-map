import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'
import { assertRateLimit } from './rate-limit'

export const reportReasons = [
  'copyright',
  'inappropriate',
  'wrong_place',
  'quality',
  'privacy',
  'closed',
  'wrong_hours',
  'wrong_address',
  'other',
] as const

export const submitReportInput = z.object({
  kind: z.enum(['photo', 'place_error']),
  reason: z.enum(reportReasons),
  details: z.string().max(2000).optional(),
  email: z.string().email().optional(),
  restaurantPublicId: z.string().max(40).optional(),
  photoId: z.number().int().optional(),
  // Honeypot — real users never fill this
  website: z.string().optional(),
})

export const submitReport = createServerFn({ method: 'POST' })
  .inputValidator(submitReportInput.parse)
  .handler(async ({ data }) => {
    if (data.website) return { ok: true }

    await assertRateLimit('report', 10, 3600)

    // Lazy imports keep this module loadable in vitest, where constructing
    // the Prisma client at import time fails
    const [{ prisma }, { getCurrentUser }] = await Promise.all([
      import('../utils/prisma'),
      import('./session'),
    ])

    let restaurantId: number | null = null
    let photoId: number | null = null
    if (data.kind === 'place_error') {
      if (!data.restaurantPublicId) throw new Error('Missing place reference')
      const restaurant = await prisma.restaurants.findUnique({
        where: { public_id: data.restaurantPublicId },
        select: { id: true },
      })
      if (!restaurant) throw new Error('Restaurant not found')
      restaurantId = restaurant.id
    } else {
      // Photos table lands in Plan 016 — store the id without a join
      if (!data.photoId || data.photoId <= 0) {
        throw new Error('Missing photo reference')
      }
      photoId = data.photoId
    }

    const user = await getCurrentUser()

    await prisma.reports.create({
      data: {
        kind: data.kind,
        restaurant_id: restaurantId,
        photo_id: photoId,
        reason: data.reason,
        details: data.details ?? null,
        reporter_email: data.email ?? null,
        reporter_did: user?.did ?? null,
      },
    })

    return { ok: true }
  })
