// Serves the atproto OAuth client metadata at `/client-metadata.json`.
// The authorization server fetches this URL to validate our client_id in
// production. Filename uses TanStack Start's escape form: `[.]` = literal
// dot in URL, trailing `_` suppresses the route from being treated as an
// extension-bearing file route.
import { createFileRoute } from '@tanstack/react-router'
import { getRequestHost } from '@tanstack/react-start/server'
import { getOAuthClient } from '../server/oauth/client'
import { isDevLoopback } from '../utils/oauth-config'

export const Route = createFileRoute('/client-metadata.json_')({
  server: {
    handlers: {
      GET: () => {
        // Loopback dev clients use the URL-encoded `client_id` form with
        // redirect_uri + scope inlined, so no hosted metadata JSON exists.
        if (isDevLoopback()) {
          return new Response('client-metadata is not served in loopback dev mode', { status: 404 })
        }
        const client = getOAuthClient(getRequestHost({ xForwardedHost: true }))
        return new Response(JSON.stringify(client.metadata, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
