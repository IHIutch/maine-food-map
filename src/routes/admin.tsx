import { Link, createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { NotFound } from '../components/NotFound'
import { getAdminQueues, resolveReport } from '../server/admin'
import { seo } from '../utils/seo'
import {
  brandCaps,
  button,
  displayHeading,
  metaLabel,
  metaRow,
} from '../components/ui'

export const Route = createFileRoute('/admin')({
  loader: async () => {
    try {
      return await getAdminQueues()
    } catch {
      // Render 404 for non-admins so the page's existence stays hidden
      throw notFound()
    }
  },
  component: AdminPage,
  notFoundComponent: () => <NotFound />,
  head: () => ({
    meta: seo({ title: 'Admin | MaineFoodMap' }),
  }),
})

function formatAge(createdAt: Date | string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${Math.max(minutes, 0)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function AdminPage() {
  const { reports } = Route.useLoaderData()
  const router = useRouter()
  const resolve = useServerFn(resolveReport)
  const [pendingId, setPendingId] = useState<number | null>(null)

  const act = async (reportId: number, action: 'resolved' | 'dismissed') => {
    setPendingId(reportId)
    try {
      await resolve({ data: { reportId, action } })
      await router.invalidate()
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <p className={metaLabel({ className: 'text-ink-soft mb-4' })}>
          Maine Food Map
        </p>
        <h1 className={displayHeading({ className: 'text-5xl sm:text-6xl mb-10' })}>
          Moderation
        </h1>

        <section className="pb-10">
          <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-6' })}>
            Open Reports
          </h2>

          {reports.length === 0 ? (
            <p className="text-ink-soft">No open reports.</p>
          ) : (
            <ul>
              {reports.map((report) => (
                <li
                  key={report.id}
                  className="py-5 border-b border-ink/10 last:border-b-0"
                >
                  <div className={metaRow({ className: 'text-ink-soft mb-2' })}>
                    <span>{report.kind === 'photo' ? 'Photo' : 'Place error'}</span>
                    <span>· {report.reason.replace(/_/g, ' ')}</span>
                    <span>· {formatAge(report.created_at)}</span>
                  </div>
                  {report.restaurant && (
                    <p className="mb-1">
                      <Link
                        to="/places/$slug"
                        params={{ slug: report.restaurant.slug }}
                        className="text-blueberry underline underline-offset-4 decoration-blueberry/40 hover:decoration-blueberry"
                      >
                        {report.restaurant.title}
                      </Link>
                    </p>
                  )}
                  {report.photo_id !== null && (
                    <p className={metaLabel({ className: 'text-ink-soft mb-1' })}>
                      Photo #{report.photo_id}
                    </p>
                  )}
                  {report.details && (
                    <p className="text-ink-soft mb-3 max-w-xl">{report.details}</p>
                  )}
                  {report.reporter_email && (
                    <p className={metaLabel({ className: 'text-ink-soft mb-3' })}>
                      Reply to: {report.reporter_email}
                    </p>
                  )}
                  <div className="flex gap-3 mt-3">
                    <button
                      type="button"
                      disabled={pendingId === report.id}
                      onClick={() => act(report.id, 'resolved')}
                      className={button({ intent: 'secondary', className: 'disabled:opacity-50' })}
                    >
                      Resolve
                    </button>
                    <button
                      type="button"
                      disabled={pendingId === report.id}
                      onClick={() => act(report.id, 'dismissed')}
                      className={button({ intent: 'secondary', className: 'disabled:opacity-50' })}
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Plan 016: pending photos section */}
        {/* Plan 017: pending places section */}
      </div>
    </div>
  )
}
