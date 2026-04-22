import { NodeOAuthClient } from '@atproto/oauth-client-node'
import { env } from 'cloudflare:workers'
import { getClientMetadata, isDev } from '../../utils/oauth-config'
import { patchRequestForWorkerd } from './patch'
import { makeSessionStore, makeStateStore } from './stores'

// Host-keyed cache: in dev, the CF vite plugin's internal proxy port can
// differ from the browser-facing port, so rebuilding per host keeps the
// redirect_uri aligned with whichever origin the current request came from.
let cached: { host: string | undefined; client: NodeOAuthClient } | null = null

export function getOAuthClient(requestHost?: string): NodeOAuthClient {
  if (cached && (!isDev() || cached.host === requestHost)) return cached.client
  patchRequestForWorkerd()
  const client = new NodeOAuthClient({
    clientMetadata: getClientMetadata(requestHost),
    stateStore: makeStateStore(env.OAUTH_STATE),
    sessionStore: makeSessionStore(env.OAUTH_SESSION),
  })
  cached = { host: requestHost, client }
  return client
}
