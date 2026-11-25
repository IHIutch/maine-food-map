import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'
import * as z from 'zod'
import { prisma } from '../utils/prisma'
import { assertRateLimit } from '../server/rate-limit'
import {
  ATTESTATION_TEXT,
  ATTESTATION_VERSION,
} from '../server/attestation'
import { getCurrentUser } from '../server/session'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_UPLOAD_BYTES = 1_500_000

const emailSchema = z.string().trim().toLowerCase().pipe(z.email())

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const Route = createFileRoute('/api/photos/upload')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData()

        // Honeypot: bots that fill the hidden field get a quiet success
        const honeypot = form.get('website')
        if (typeof honeypot === 'string' && honeypot.length > 0) {
          return json({ ok: true })
        }

        try {
          await assertRateLimit('photo-upload', 10, 3600)
        } catch {
          return json({ error: 'RATE_LIMITED' }, 429)
        }

        const user = await getCurrentUser()
        let email: string | null = null
        if (!user) {
          const rawEmail = form.get('email')
          const parsed = emailSchema.safeParse(rawEmail)
          if (!parsed.success) {
            return json({ error: 'IDENTITY_REQUIRED' }, 400)
          }
          email = parsed.data
        }

        if (form.get('perPhotoAttested') !== 'true') {
          return json({ error: 'ATTESTATION_REQUIRED' }, 400)
        }

        const contributor = user
          ? await prisma.contributors.findUnique({ where: { did: user.did } })
          : await prisma.contributors.findUnique({ where: { email: email! } })
        if (contributor?.attestation_version !== ATTESTATION_VERSION) {
          return json({ error: 'AGREEMENT_REQUIRED' }, 409)
        }

        const restaurantPublicId = form.get('restaurantPublicId')
        if (typeof restaurantPublicId !== 'string' || !restaurantPublicId) {
          return json({ error: 'RESTAURANT_REQUIRED' }, 400)
        }
        const restaurant = await prisma.restaurants.findUnique({
          where: { public_id: restaurantPublicId },
          select: { id: true },
        })
        if (!restaurant) {
          return json({ error: 'RESTAURANT_NOT_FOUND' }, 404)
        }

        const file = form.get('file')
        if (!(file instanceof File)) {
          return json({ error: 'FILE_REQUIRED' }, 400)
        }
        const ext = ALLOWED_TYPES[file.type]
        if (!ext) {
          return json({ error: 'UNSUPPORTED_TYPE' }, 400)
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          return json({ error: 'FILE_TOO_LARGE' }, 400)
        }

        const alt = form.get('alt')
        const altText =
          typeof alt === 'string' && alt.trim().length > 0
            ? alt.trim().slice(0, 500)
            : null

        const r2Key = `pending/${crypto.randomUUID()}.${ext}`
        await env.PHOTOS.put(r2Key, file.stream(), {
          httpMetadata: { contentType: file.type },
        })

        const photo = await prisma.photos.create({
          data: {
            restaurant_id: restaurant.id,
            status: 'pending',
            uploader_did: user?.did ?? null,
            uploader_handle: user?.handle ?? null,
            uploader_email: email,
            r2_key: r2Key,
            content_type: file.type,
            size_bytes: file.size,
            alt_text: altText,
            attestation_version: ATTESTATION_VERSION,
            attestation_text: ATTESTATION_TEXT,
            attested_at: new Date(),
          },
        })

        return json({ ok: true, photoId: photo.id })
      },
    },
  },
})
