import { createServerFn } from '@tanstack/react-start'
import * as z from 'zod'
import { prisma } from '../utils/prisma'
import { getCurrentUser, type CurrentUser } from './session'

export async function requireAdmin(): Promise<CurrentUser> {
  const adminDid = process.env.ADMIN_DID
  const user = await getCurrentUser()
  if (!adminDid || !user || user.did !== adminDid) {
    throw new Error('FORBIDDEN')
  }
  return user
}

export const getAdminQueues = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAdmin()

    // No cacheStrategy: the admin queue needs fresh rows
    const reports = await prisma.reports.findMany({
      where: { status: 'open' },
      orderBy: { created_at: 'asc' },
    })

    const restaurantIds = [
      ...new Set(
        reports
          .map((r) => r.restaurant_id)
          .filter((id): id is number => id !== null),
      ),
    ]
    const restaurants =
      restaurantIds.length > 0
        ? await prisma.restaurants.findMany({
            where: { id: { in: restaurantIds } },
            select: { id: true, title: true, slug: true },
          })
        : []
    const restaurantsById = new Map(restaurants.map((r) => [r.id, r]))

    // Plans 016/017 add pending-photo and pending-place queues here
    return {
      reports: reports.map((r) => ({
        ...r,
        restaurant:
          r.restaurant_id !== null
            ? (restaurantsById.get(r.restaurant_id) ?? null)
            : null,
      })),
    }
  },
)

export const resolveReport = createServerFn({ method: 'POST' })
  .inputValidator(
    z
      .object({
        reportId: z.number().int().positive(),
        action: z.enum(['resolved', 'dismissed']),
        note: z.string().max(1000).optional(),
      })
      .parse,
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    await prisma.reports.update({
      where: { id: data.reportId },
      data: {
        status: data.action,
        resolved_at: new Date(),
        resolution_note: data.note ?? null,
      },
    })
    return { ok: true }
  })
