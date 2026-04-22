import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  deleteCookie,
  getCookie,
  getRequestHost,
} from '@tanstack/react-start/server'
import { getOAuthClient, getRedirectUri } from '../server/oauth/client'
import { resolveHandleForDid, setCurrentUser } from '../server/session'

const handleCallback = createServerFn({ method: 'GET' })
  .inputValidator((d: { searchString: string }) => d)
  .handler(async ({ data }) => {
    const params = new URLSearchParams(data.searchString)
    // Use the origin saved at login start so redirect_uri matches the value
    // the authorization server recorded during PAR.
    const host =
      getCookie('mfm_oauth_origin') ??
      getRequestHost({ xForwardedHost: true })
    deleteCookie('mfm_oauth_origin', { path: '/' })
    const client = getOAuthClient(host)
    const { session, state } = await client.callback(params, {
      redirectUri: getRedirectUri(host),
    })
    const did = session.did
    const handle = (await resolveHandleForDid(did)) ?? did
    await setCurrentUser({ did, handle })

    let next = '/'
    if (state && typeof state === 'object' && 'next' in state) {
      const nextVal = (state as { next?: unknown }).next
      if (typeof nextVal === 'string') next = nextVal
    }
    return { next }
  })

export const Route = createFileRoute('/oauth/callback')({
  validateSearch: (search) => search as Record<string, string>,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const qs = new URLSearchParams(
      deps.search as Record<string, string>,
    ).toString()
    const { next } = await handleCallback({ data: { searchString: qs } })
    throw redirect({ to: next as any })
  },
  component: () => (
    <div className="p-6 text-gray-600">Completing sign-in…</div>
  ),
  errorComponent: ({ error }) => (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-2">Sign-in failed</h1>
      <p className="text-sm text-gray-700 mb-4">
        {error instanceof Error ? error.message : 'Unknown error'}
      </p>
      <a href="/login" className="text-blue-600 hover:underline">
        Try again
      </a>
    </div>
  ),
})
