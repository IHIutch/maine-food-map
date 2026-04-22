import type { OAuthClientMetadataInput } from '@atproto/oauth-client-node'

// `transition:generic` is required during the atproto OAuth transition period
// to write records under custom lexicons like app.mainefoodmap.like.
const SCOPE = 'atproto transition:generic'

export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production'
}

// atproto loopback-client spec requires the literal host `127.0.0.1`, not
// `localhost`. We normalize here so cookie-stored origins from the browser
// still produce a spec-compliant client_id.
export function getPublicUrl(requestHost?: string): string {
  const env = process.env as Record<string, string | undefined>
  if (isDev()) {
    if (requestHost) {
      const host = requestHost.includes(':')
        ? requestHost
        : `${requestHost}:${env.VITE_PORT || '3000'}`
      const normalized = host.replace(/^localhost/, '127.0.0.1')
      return `http://${normalized}`
    }
    const port = env.VITE_PORT || '3000'
    return `http://127.0.0.1:${port}`
  }
  if (env.PUBLIC_URL) return env.PUBLIC_URL.replace(/\/$/, '')
  throw new Error('PUBLIC_URL is not set in production environment')
}

export function isDevLoopback(): boolean {
  return isDev()
}

// Dev uses the loopback client form (`http://localhost?...`) with the
// redirect_uri and scope encoded into client_id; prod uses a hosted
// client-metadata JSON. This mirrors the atproto OAuth spec.
export function getClientMetadata(requestHost?: string): OAuthClientMetadataInput {
  const publicUrl = getPublicUrl(requestHost)
  if (isDevLoopback()) {
    const redirectUri = `${publicUrl}/oauth/callback`
    return {
      client_id: `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPE)}`,
      client_name: 'Maine Food Map (dev)',
      redirect_uris: [redirectUri as `${string}:${string}`],
      scope: SCOPE,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      application_type: 'web',
      dpop_bound_access_tokens: true,
    }
  }
  return {
    client_id: `${publicUrl}/client-metadata.json`,
    client_name: 'Maine Food Map',
    client_uri: publicUrl,
    redirect_uris: [`${publicUrl}/oauth/callback`],
    scope: SCOPE,
    grant_types: ['authorization_code', 'refresh_token'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    dpop_bound_access_tokens: true,
  }
}
