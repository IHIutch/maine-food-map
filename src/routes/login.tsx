import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHost, setCookie } from '@tanstack/react-start/server'
import { useState } from 'react'
import { getOAuthClient, getRedirectUri } from '../server/oauth/client'
import { seo } from '../utils/seo'
import * as z from 'zod'
import { button, card, displayHeading, metaLabel } from '../components/ui'

const startLogin = createServerFn({ method: 'POST' })
  .inputValidator(
    z
      .object({
        handle: z.string().trim().min(1).max(253),
        next: z.string().max(2000).optional(),
        origin: z.string().url().max(200).optional(),
      })
      .parse,
  )
  .handler(async ({ data }) => {
    const trimmed = data.handle.trim().replace(/^@/, '')
    if (!trimmed) {
      throw new Error('Please enter your Bluesky handle')
    }
    // Browser-supplied origin wins: getRequestHost() returns the CF vite
    // plugin's internal proxy port, not the user-facing one.
    const host = data.origin
      ? new URL(data.origin).host
      : getRequestHost({ xForwardedHost: true })
    // Persist the origin across the OAuth hop so the callback rebuilds the
    // client with the same host and the redirect_uri matches what the
    // authorization server recorded during PAR.
    setCookie('mfm_oauth_origin', host, {
      path: '/',
      maxAge: 10 * 60,
      httpOnly: true,
      sameSite: 'lax',
    })
    const client = getOAuthClient(host)
    const redirectUri = getRedirectUri(host)
    const { url } = await client.authorize({
      target: { type: 'account', identifier: trimmed as any },
      state: data.next ? { next: data.next } : undefined,
      redirectUri,
    })
    // Return the URL rather than `throw redirect(...)`: a redirect response
    // from a server-fn RPC is consumed by the client fetch, not the browser.
    return { url: url.toString() }
  })

export const Route = createFileRoute('/login')({
  validateSearch: (search) =>
    ({ next: typeof search.next === 'string' ? search.next : undefined }) as {
      next?: string
    },
  component: LoginPage,
  head: () => ({
    meta: seo({ title: 'Sign in with Bluesky | MaineFoodMap' }),
  }),
})

function LoginPage() {
  const { next } = Route.useSearch()
  const [handle, setHandle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className={card({ className: 'max-w-sm w-full p-8' })}>
        <p className={metaLabel({ className: 'text-pine mb-2' })}>Maine Food Map</p>
        <h1 className={displayHeading({ className: 'text-3xl mb-3' })}>
          Sign in with Bluesky
        </h1>
        <p className="text-sm text-ink-soft mb-6">
          Enter your Bluesky handle to sign in. Your likes are stored on your
          Bluesky account.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            setSubmitting(true)
            setError(null)
            try {
              const { url } = await startLogin({
                data: { handle, next, origin: window.location.origin },
              })
              window.location.href = url
            } catch (err) {
              setError(
                err instanceof Error ? err.message : 'Something went wrong',
              )
              setSubmitting(false)
            }
          }}
        >
          <label className={metaLabel({ className: 'block mb-2 text-ink-soft' })}>
            Handle
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="alice.bsky.social"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            className="w-full rounded-xl border border-ink/15 bg-paper px-3 py-2.5 mb-4 focus:outline-none focus:ring-2 focus:ring-pine"
          />
          {error && (
            <div className="mb-4 text-sm text-tomato">{error}</div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className={button({ className: 'w-full disabled:opacity-50' })}
          >
            {submitting ? 'Redirecting…' : 'Continue'}
          </button>
        </form>
        <p className="mt-4 text-xs text-ink-soft">
          Don't have a Bluesky account? Create one at{' '}
          <a
            href="https://bsky.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pine underline underline-offset-4 decoration-pine/40 hover:decoration-pine"
          >
            bsky.app
          </a>
          .
        </p>
      </div>
    </div>
  )
}
