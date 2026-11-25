import { createFileRoute } from '@tanstack/react-router'
import { env, waitUntil } from 'cloudflare:workers'
import { requireAdmin } from '../server/admin'

const KEY_PATTERN = /^(approved|pending|trash)\/[a-z0-9-]+\.(webp|jpe?g|png)$/

export const Route = createFileRoute('/img/$')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const key = decodeURIComponent(url.pathname.replace(/^\/img\//, ''))
        if (!KEY_PATTERN.test(key)) {
          return new Response('Not found', { status: 404 })
        }

        const isApproved = key.startsWith('approved/')
        if (!isApproved) {
          // Admin-only prefixes 404 (not 403) to avoid confirming keys exist
          try {
            await requireAdmin()
          } catch {
            return new Response('Not found', { status: 404 })
          }
        }

        // Workers' caches.default is hidden by the DOM lib's CacheStorage type
        const cache = (caches as unknown as { default: Cache }).default
        const cacheKey = new Request(url.toString())
        if (isApproved) {
          const hit = await cache.match(cacheKey)
          if (hit) return hit
        }

        const obj = await env.PHOTOS.get(key)
        if (!obj) {
          return new Response('Not found', { status: 404 })
        }
        const response = new Response(obj.body, {
          headers: {
            'Content-Type': obj.httpMetadata?.contentType ?? 'image/webp',
            'Cache-Control': 'public, max-age=31536000, immutable',
            ETag: obj.httpEtag,
          },
        })
        if (isApproved) {
          waitUntil(cache.put(cacheKey, response.clone()))
        }
        return response
      },
    },
  },
})
