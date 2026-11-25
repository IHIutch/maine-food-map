import { Client } from '@atcute/client'
import type { Did } from '@atcute/lexicons'
import type { OAuthSession } from '@atcute/oauth-node-client'
import { useSession } from '@tanstack/react-start/server'
import { getOAuthClient } from './oauth/client'

const SESSION_COOKIE = 'mfm_session'

type SessionData = {
  did?: string
  handle?: string
}

function getSessionPassword(): string {
  const pwd = process.env.SESSION_COOKIE_SECRET
  if (pwd && pwd.length >= 32) return pwd
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_COOKIE_SECRET must be set (>=32 chars) in production',
    )
  }
  return 'dev-only-insecure-session-cookie-secret-replace-in-prod'
}

async function getSessionManager() {
  return useSession<SessionData>({
    name: SESSION_COOKIE,
    password: getSessionPassword(),
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  })
}

export type CurrentUser = { did: string; handle: string }

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSessionManager()
  if (!session.data.did) return null
  return {
    did: session.data.did,
    handle: session.data.handle ?? session.data.did,
  }
}

export async function setCurrentUser(user: CurrentUser): Promise<void> {
  const session = await getSessionManager()
  await session.update({ did: user.did, handle: user.handle })
}

export async function clearCurrentSession(): Promise<void> {
  const session = await getSessionManager()
  await session.clear()
}

export type AuthenticatedSession = CurrentUser & {
  oauthSession: OAuthSession
  rpc: Client
}

export async function getAuthenticatedSession(
  requestHost?: string,
): Promise<AuthenticatedSession | null> {
  const user = await getCurrentUser()
  if (!user) return null
  try {
    const client = getOAuthClient(requestHost)
    const oauthSession = await client.restore(user.did as Did)
    const rpc = new Client({ handler: oauthSession })
    return { ...user, oauthSession, rpc }
  } catch {
    await clearCurrentSession()
    return null
  }
}

export async function resolveHandleForDid(did: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`,
    )
    if (!res.ok) return null
    const json = (await res.json()) as { handle?: string }
    return json.handle ?? null
  } catch {
    return null
  }
}
