import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHost } from '@tanstack/react-start/server'
import { getOAuthClient } from '../server/oauth/client'
import { clearCurrentSession, getCurrentUser } from '../server/session'

const doLogout = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await getCurrentUser()
  if (user) {
    try {
      const client = getOAuthClient(getRequestHost())
      const sess = await client.restore(user.did)
      await sess.signOut().catch(() => {})
    } catch {
      // ignore — cookie will be cleared regardless
    }
  }
  await clearCurrentSession()
  throw redirect({ to: '/' })
})

export const Route = createFileRoute('/logout')({
  loader: () => doLogout(),
})
