import { ok } from '@atcute/client'
import {
  ComAtprotoRepoCreateRecord,
  ComAtprotoRepoDeleteRecord,
  ComAtprotoRepoListRecords,
} from '@atcute/atproto'
import type { Did, Nsid } from '@atcute/lexicons'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHost } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'
import { prisma } from '../utils/prisma'
import { getPublicUrl } from '../utils/oauth-config'
import { getAuthenticatedSession, getCurrentUser } from './session'

const COLLECTION = 'app.mainefoodmap.like'
const CONSTELLATION_BASE = 'https://constellation.microcosm.blue'
const TOTAL_TTL_SECONDS = 300
const VIEWER_TTL_SECONDS = 60

function subjectUriFor(publicId: string): string {
  return `${getPublicUrl()}/r/${publicId}`
}

async function fetchConstellationTotal(subject: string): Promise<number> {
  const url = new URL(`${CONSTELLATION_BASE}/links/distinct-dids`)
  url.searchParams.set('target', subject)
  url.searchParams.set('collection', COLLECTION)
  url.searchParams.set('path', '.subject.uri')
  url.searchParams.set('limit', '1')
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return 0
    const json = (await res.json()) as { total?: number }
    return typeof json.total === 'number' ? json.total : 0
  } catch {
    return 0
  }
}

async function getCachedTotal(publicId: string): Promise<number> {
  const key = `likes:${publicId}:total`
  const cached = await env.LIKES_CACHE.get(key)
  if (cached !== null) {
    const n = Number(cached)
    if (!Number.isNaN(n)) return n
  }
  const total = await fetchConstellationTotal(subjectUriFor(publicId))
  await env.LIKES_CACHE.put(key, String(total), {
    expirationTtl: TOTAL_TTL_SECONDS,
  })
  return total
}

async function writeCachedTotal(publicId: string, total: number): Promise<void> {
  await env.LIKES_CACHE.put(`likes:${publicId}:total`, String(total), {
    expirationTtl: TOTAL_TTL_SECONDS,
  })
}

type ViewerLike = { uri: string; rkey: string }

async function listViewerLikes(did: string): Promise<Map<string, ViewerLike>> {
  const cacheKey = `likes:viewer:${did}`
  const cached = await env.LIKES_CACHE.get(cacheKey, 'json')
  if (cached && Array.isArray((cached as any).entries)) {
    const map = new Map<string, ViewerLike>()
    for (const e of (cached as any).entries as Array<
      ViewerLike & { subject: string }
    >) {
      map.set(e.subject, { uri: e.uri, rkey: e.rkey })
    }
    return map
  }
  const session = await getAuthenticatedSession(
    getRequestHost({ xForwardedHost: true }),
  )
  if (!session) return new Map()
  const map = new Map<string, ViewerLike>()
  let cursor: string | undefined
  for (let page = 0; page < 5; page++) {
    const res = await ok(
      session.rpc.call(ComAtprotoRepoListRecords.mainSchema, {
        params: {
          repo: did as Did,
          collection: COLLECTION as Nsid,
          limit: 100,
          cursor,
        },
      }),
    )
    for (const rec of res.records ?? []) {
      const subject = (rec.value as any)?.subject?.uri
      if (typeof subject === 'string') {
        const rkey = String(rec.uri).split('/').pop() ?? ''
        map.set(subject, { uri: rec.uri, rkey })
      }
    }
    cursor = res.cursor
    if (!cursor) break
  }
  const entries = [...map.entries()].map(([subject, v]) => ({ subject, ...v }))
  await env.LIKES_CACHE.put(cacheKey, JSON.stringify({ entries }), {
    expirationTtl: VIEWER_TTL_SECONDS,
  })
  return map
}

async function invalidateViewerLikes(did: string): Promise<void> {
  await env.LIKES_CACHE.delete(`likes:viewer:${did}`)
}

export const getLikesForRestaurant = createServerFn({ method: 'GET' })
  .inputValidator((d: { publicId: string }) => d)
  .handler(async ({ data }) => {
    const [user, total] = await Promise.all([
      getCurrentUser(),
      getCachedTotal(data.publicId),
    ])
    let userHasLiked = false
    if (user) {
      const likes = await listViewerLikes(user.did)
      userHasLiked = likes.has(subjectUriFor(data.publicId))
    }
    return { totalLikes: total, userHasLiked }
  })

export const likeRestaurant = createServerFn({ method: 'POST' })
  .inputValidator((d: { publicId: string }) => d)
  .handler(async ({ data }) => {
    const session = await getAuthenticatedSession(
      getRequestHost({ xForwardedHost: true }),
    )
    if (!session) throw new Error('Not signed in')

    const restaurant = await prisma.restaurants.findUnique({
      where: { public_id: data.publicId },
      select: { public_id: true, slug: true },
    })
    if (!restaurant) throw new Error('Restaurant not found')

    const subject = subjectUriFor(data.publicId)

    const existing = await listViewerLikes(session.did)
    if (!existing.has(subject)) {
      await ok(
        session.rpc.call(ComAtprotoRepoCreateRecord.mainSchema, {
          input: {
            repo: session.did as Did,
            collection: COLLECTION as Nsid,
            record: {
              $type: COLLECTION,
              subject: { uri: subject },
              createdAt: new Date().toISOString(),
            },
          },
        }),
      )
      await invalidateViewerLikes(session.did)
      const current = await getCachedTotal(data.publicId)
      await writeCachedTotal(data.publicId, current + 1)
    }

    return {
      totalLikes: await getCachedTotal(data.publicId),
      userHasLiked: true,
    }
  })

export const unlikeRestaurant = createServerFn({ method: 'POST' })
  .inputValidator((d: { publicId: string }) => d)
  .handler(async ({ data }) => {
    const session = await getAuthenticatedSession(
      getRequestHost({ xForwardedHost: true }),
    )
    if (!session) throw new Error('Not signed in')

    const subject = subjectUriFor(data.publicId)
    const existing = await listViewerLikes(session.did)
    const record = existing.get(subject)
    if (record) {
      await ok(
        session.rpc.call(ComAtprotoRepoDeleteRecord.mainSchema, {
          input: {
            repo: session.did as Did,
            collection: COLLECTION as Nsid,
            rkey: record.rkey,
          },
        }),
      )
      await invalidateViewerLikes(session.did)
      const current = await getCachedTotal(data.publicId)
      await writeCachedTotal(data.publicId, Math.max(current - 1, 0))
    }

    return {
      totalLikes: await getCachedTotal(data.publicId),
      userHasLiked: false,
    }
  })
