import { createServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import * as z from 'zod'
import { prisma } from '../utils/prisma'
import type { CurrentUser } from './session'

/* Session is imported lazily: requireAdmin is a plain export, so a static
 * import would survive the client-bundle transform and drag the
 * Workers-only session/oauth graph into the browser build. */
export async function requireAdmin(): Promise<CurrentUser> {
  const { getCurrentUser } = await import('./session')
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

    const pendingPhotos = await prisma.photos.findMany({
      where: { status: 'pending' },
      orderBy: { created_at: 'asc' },
    })
    const photoRestaurantIds = [
      ...new Set(pendingPhotos.map((p) => p.restaurant_id)),
    ].filter((id) => !restaurantsById.has(id))
    if (photoRestaurantIds.length > 0) {
      const more = await prisma.restaurants.findMany({
        where: { id: { in: photoRestaurantIds } },
        select: { id: true, title: true, slug: true },
      })
      for (const r of more) restaurantsById.set(r.id, r)
    }

    // Plan 017 adds a pending-place queue here
    return {
      reports: reports.map((r) => ({
        ...r,
        restaurant:
          r.restaurant_id !== null
            ? (restaurantsById.get(r.restaurant_id) ?? null)
            : null,
      })),
      pendingPhotos: pendingPhotos.map((p) => ({
        ...p,
        restaurant: restaurantsById.get(p.restaurant_id) ?? null,
      })),
    }
  },
)

/* Move an R2 object (R2 has no rename): copy body + content type, then
 * delete the source. The trash/ prefix is the recovery net for rejects. */
async function moveObject(
  fromKey: string,
  toKey: string,
  fallbackContentType: string,
): Promise<boolean> {
  const obj = await env.PHOTOS.get(fromKey)
  if (!obj) return false
  await env.PHOTOS.put(toKey, obj.body, {
    httpMetadata: {
      contentType: obj.httpMetadata?.contentType ?? fallbackContentType,
    },
  })
  await env.PHOTOS.delete(fromKey)
  return true
}

function keyExtension(key: string): string {
  return key.split('.').pop() ?? 'webp'
}

export const approvePhoto = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ photoId: z.number().int().positive() }).parse)
  .handler(async ({ data }) => {
    await requireAdmin()
    const photo = await prisma.photos.findUnique({
      where: { id: data.photoId },
    })
    if (!photo || photo.status !== 'pending') {
      throw new Error('NOT_PENDING')
    }
    const destKey = `approved/${photo.id}.${keyExtension(photo.r2_key)}`
    const moved = await moveObject(photo.r2_key, destKey, photo.content_type)
    if (!moved) throw new Error('OBJECT_MISSING')
    await prisma.photos.update({
      where: { id: photo.id },
      data: { status: 'approved', r2_key: destKey, reviewed_at: new Date() },
    })
    return { ok: true }
  })

async function rejectPhotoById(photoId: number): Promise<void> {
  const photo = await prisma.photos.findUnique({ where: { id: photoId } })
  if (!photo) throw new Error('PHOTO_NOT_FOUND')
  if (photo.status === 'rejected') return
  const destKey = `trash/${photo.id}.${keyExtension(photo.r2_key)}`
  await moveObject(photo.r2_key, destKey, photo.content_type)
  await prisma.photos.update({
    where: { id: photo.id },
    data: { status: 'rejected', r2_key: destKey, reviewed_at: new Date() },
  })
}

export const rejectPhoto = createServerFn({ method: 'POST' })
  .inputValidator(
    z
      .object({
        photoId: z.number().int().positive(),
        alsoRemoveApproved: z.boolean().optional(),
      })
      .parse,
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    const photo = await prisma.photos.findUnique({
      where: { id: data.photoId },
    })
    if (!photo) throw new Error('PHOTO_NOT_FOUND')
    if (photo.status === 'approved' && !data.alsoRemoveApproved) {
      throw new Error('ALREADY_APPROVED')
    }
    await rejectPhotoById(photo.id)
    return { ok: true }
  })

export const resolveReport = createServerFn({ method: 'POST' })
  .inputValidator(
    z
      .object({
        reportId: z.number().int().positive(),
        action: z.enum(['resolved', 'dismissed']),
        note: z.string().max(1000).optional(),
        rejectReportedPhoto: z.boolean().optional(),
      })
      .parse,
  )
  .handler(async ({ data }) => {
    await requireAdmin()
    if (data.rejectReportedPhoto) {
      const report = await prisma.reports.findUnique({
        where: { id: data.reportId },
      })
      if (report?.kind === 'photo' && report.photo_id !== null) {
        await rejectPhotoById(report.photo_id)
      }
    }
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
