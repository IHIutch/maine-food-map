/// <reference types="vite/client" />
import {
  createRootRoute,
  HeadContent,
  Link,
  Scripts,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { load, trackPageview } from 'fathom-client'
import * as React from 'react'

import { DefaultCatchBoundary } from '../components/default-catch-boundary'
import Footer from '../components/footer'
import { NotFound } from '../components/not-found'
import SiteSearch from '../components/site-search'
import appCss from '../styles/app.css?url'
import { seo } from '../utils/seo'

function FathomAnalytics() {
  // Follow the settled route, excluding hash-only changes.
  const pagePath = useRouterState({
    select: (state) => {
      const location = state.resolvedLocation
      return location ? location.pathname + location.searchStr : null
    },
  })
  const lastTrackedPath = React.useRef<string | null>(null)

  React.useEffect(() => {
    // The tracking effect owns initial and subsequent page views.
    load('KKNJFATJ', { auto: false })
  }, [])

  React.useEffect(() => {
    // Wait for startup to resolve and suppress calls from effect replay.
    if (pagePath === null || lastTrackedPath.current === pagePath)
      return

    // Pass search unchanged so Fathom applies its own reporting rules.
    trackPageview({ url: pagePath })
    lastTrackedPath.current = pagePath
  }, [pagePath])

  return null
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        title:
          'MaineFoodMap',
        description: ``,
      }),
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'manifest', href: '/site.webmanifest', color: '#fffff' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html className="h-full" lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="h-full bg-ink font-instrument">
        {/* Wrapper so the mobile search sheet has something to scale back. */}
        <div id="app-shell" className="min-h-full bg-white">
          <nav className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 sm:px-6">
            <Link
              to="/"
              className="shrink-0 font-pretrona text-xl font-medium tracking-tight sm:text-2xl"
            >
              Maine Food Map
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <SiteSearch />
            </div>
          </nav>
          {children}
          <Footer />
        </div>
        <Scripts />
        {import.meta.env.PROD
          ? <FathomAnalytics />
          : null}
        <TanStackRouterDevtools position="bottom-right" />
      </body>
    </html>
  )
}
