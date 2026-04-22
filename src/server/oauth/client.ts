import { OAuthClient, scope } from '@atcute/oauth-node-client'
import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
  type HandleResolver,
} from '@atcute/identity-resolver'
import { env } from 'cloudflare:workers'
import { getPublicUrl, isDev } from '../../utils/oauth-config'
import { makeSessionStore, makeStateStore } from './stores'

// workerd has no `node:dns`, so we can't use NodeDnsHandleResolver. Most
// handles (bsky.social, custom domains with well-known) resolve via HTTP;
// DNS-only custom handles won't. We stub DNS with a rejecting resolver
// since CompositeHandleResolver's `methods` field requires both keys.
const noopDnsResolver: HandleResolver = {
  async resolve() {
    throw new Error('DNS handle resolution unavailable in workerd')
  },
}

function makeActorResolver() {
  return new LocalActorResolver({
    handleResolver: new CompositeHandleResolver({
      methods: {
        http: new WellKnownHandleResolver(),
        dns: noopDnsResolver,
      },
    }),
    didDocumentResolver: new CompositeDidDocumentResolver({
      methods: {
        plc: new PlcDidDocumentResolver(),
        web: new WebDidDocumentResolver(),
      },
    }),
  })
}

// We only read/write our own collection; the granular scope is cheaper in
// consent UX than asking for transition:generic.
const SCOPES = [
  scope.repo({ collection: ['app.mainefoodmap.like'] }),
]

// Host-keyed cache: metadata.redirect_uris is a whitelist the authorization
// server validates against; in dev the browser-facing port varies per
// request (CF vite plugin proxy), so we rebuild the client when the host
// changes. In prod a single host is used and this cache is effectively
// long-lived.
let cached: { host: string | undefined; client: OAuthClient } | null = null

export function getOAuthClient(requestHost?: string): OAuthClient {
  if (cached && (!isDev() || cached.host === requestHost)) return cached.client
  const publicUrl = getPublicUrl(requestHost)
  const redirectUri = `${publicUrl}/oauth/callback`
  // Loopback client (dev): client_id omitted; atcute synthesizes it from
  // redirect_uris+scope per the atproto OAuth spec.
  // Discoverable public client (prod): client_id is the hosted metadata URL.
  const metadata = isDev()
    ? { redirect_uris: [redirectUri], scope: SCOPES }
    : {
        client_id: `${publicUrl}/client-metadata.json`,
        client_uri: publicUrl,
        client_name: 'Maine Food Map',
        redirect_uris: [redirectUri],
        scope: SCOPES,
        application_type: 'web' as const,
      }
  const client = new OAuthClient({
    metadata,
    stores: {
      sessions: makeSessionStore(env.OAUTH_SESSION),
      states: makeStateStore(env.OAUTH_STATE),
    },
    actorResolver: makeActorResolver(),
  })
  cached = { host: requestHost, client }
  return client
}

export function getRedirectUri(requestHost?: string): string {
  return `${getPublicUrl(requestHost)}/oauth/callback`
}
