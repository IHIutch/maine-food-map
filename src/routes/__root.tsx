/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
  useLocation,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
// import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { DefaultCatchBoundary } from '../components/DefaultCatchBoundary'
import { NotFound } from '../components/NotFound'
import appCss from '../styles/app.css?url'
import { baseUrl } from '../utils/base-url'
import { seo } from '../utils/seo'
import { load, trackPageview } from 'fathom-client';
import { getCurrentUser } from '../server/session'
import { navLink } from '../components/ui'

const fetchCurrentUser = createServerFn({ method: 'GET' }).handler(async () => {
  return await getCurrentUser()
})

function FathomAnalytics() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    load("KKNJFATJ", {
      auto: false
    });
  }, []);

  React.useEffect(() => {
    if (!pathname) return;
    trackPageview({
      url: pathname,
      referrer: document.referrer
    });
  }, [pathname]);

  return null;
}

export const Route = createRootRoute({
  beforeLoad: async () => {
    const user = await fetchCurrentUser()
    return { user }
  },
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
        description: 'Discover great restaurants across Maine — hours, photos, and community likes.',
        image: `${baseUrl}/android-chrome-512x512.png`,
        url: baseUrl,
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
      { rel: 'manifest', href: '/site.webmanifest' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  errorComponent: DefaultCatchBoundary,
  notFoundComponent: () => <NotFound />,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { user } = Route.useRouteContext()
  const { pathname } = useLocation()
  const logoutHref = `/logout?next=${encodeURIComponent(pathname)}`
  const loginHref = `/login?next=${encodeURIComponent(pathname)}`
  return (
    <html className="h-full" lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="h-full bg-paper text-ink font-sans antialiased">
        <nav className="bg-paper border-b border-ink/15 h-16 z-10 relative flex items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-3 font-brand italic text-xl sm:text-[26px] font-medium tracking-[-0.01em] text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-full bg-accent font-brand not-italic text-xl text-paper transition-transform group-hover:scale-105"
            >
              m
            </span>
            Maine Food Map
          </Link>
          <div className="text-sm">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-ink-soft">@{user.handle}</span>
                <a href={logoutHref} className={navLink()}>
                  Log out
                </a>
              </div>
            ) : (
              <a href={loginHref} className={navLink()}>
                Sign in with Bluesky
              </a>
            )}
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
