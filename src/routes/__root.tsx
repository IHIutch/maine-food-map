/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useEffect, useRef, type ReactNode } from 'react'
import { DefaultCatchBoundary } from '../components/DefaultCatchBoundary'
import { NotFound } from '../components/NotFound'
import { button, navLink } from '../components/ui'
import appCss from '../styles/app.css?url'
import { seo } from '../utils/seo'
import { load, trackPageview } from 'fathom-client'

function FathomAnalytics() {
  // Follow the settled route, excluding hash-only changes.
  const pagePath = useRouterState({
    select: (state) => {
      const location = state.resolvedLocation
      return location ? location.pathname + location.searchStr : null
    },
  })
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    // The tracking effect owns initial and subsequent page views.
    load('KKNJFATJ', { auto: false })
  }, [])

  useEffect(() => {
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

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html className="h-full" lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-instrument h-full">
        <nav className="bg-white border-b border-stone-200 h-16 z-10 flex items-center justify-between px-4 sm:px-6 sticky top-0">
          <Link
            to="/"
            className="font-pretrona text-2xl font-medium tracking-tight"
          >
            Maine Food Map
          </Link>
          <div className="flex items-center gap-3">
            <button className={button({ scheme: 'blueberry' })}>Submit a Spot</button>
            <button className={button({ scheme: 'outline' })}>Log In</button>
          </div>
        </nav>
        {children}
        {/* <TanStackRouterDevtools position="bottom-right" /> */}
        <Scripts />
        {process.env.NODE_ENV === 'production'
          ? <FathomAnalytics />
          : null
        }
      </body>
    </html>
  )
}
