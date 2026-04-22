import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHost } from '@tanstack/react-start/server'
import type { Did } from '@atcute/lexicons'
import { getOAuthClient } from '../server/oauth/client'
import { clearCurrentSession, getCurrentUser } from '../server/session'

const doLogout = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUser()
  if (user) {
    try {
      const client = getOAuthClient(getRequestHost({ xForwardedHost: true }))
      await client.revoke(user.did as Did).catch(() => {})
    } catch {
      // ignore — cookie will be cleared regardless
    }
  }
  await clearCurrentSession()
})

// Only accept same-origin paths for `next` so `?next=https://evil.com`
// can't redirect victims elsewhere post-logout.
function sanitizeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

export const Route = createFileRoute('/logout')({
  validateSearch: (search) =>
    ({ next: typeof search.next === 'string' ? search.next : undefined }) as {
      next?: string
    },
  loaderDeps: ({ search }) => ({ next: search.next }),
  loader: async ({ deps }) => {
    await doLogout()
    throw redirect({ href: sanitizeNext(deps.next) })
  },
})
