/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
  useLocation,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { DefaultCatchBoundary } from '../components/DefaultCatchBoundary'
import { NotFound } from '../components/NotFound'
import appCss from '../styles/app.css?url'
import { seo } from '../utils/seo'
import { Analytics as VercelAnalytics } from '@vercel/analytics/react'
import { load, trackPageview } from 'fathom-client';

function FathomAnalytics() {
  const { pathname, searchStr } = useLocation();

  React.useEffect(() => {
    load("KKNJFATJ", {
      auto: false
    });
  }, []);

  React.useEffect(() => {
    if (!pathname) return;

    trackPageview({
      url: pathname + searchStr,
      referrer: document.referrer
    });
  }, [pathname, searchStr]);

  return null;
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
      <body className="h-full">
        <nav className="bg-white shadow-sm h-16 z-10 relative flex items-center px-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-semibold">
              Maine Food Map
            </Link>
          </div>
        </nav>
        {children}
        <TanStackRouterDevtools position="bottom-right" />
        <Scripts />
        {process.env.NODE_ENV === "production"
          ? <FathomAnalytics />
          : null
        }
        <VercelAnalytics />
      </body>
    </html>
  )
}
