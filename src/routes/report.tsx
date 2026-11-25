import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import * as z from 'zod'
import { submitReport } from '../server/reports'
import { seo } from '../utils/seo'
import {
  brandCaps,
  button,
  displayHeading,
  input,
  metaLabel,
  toggleSegment,
} from '../components/ui'

const reasonLabels: Record<string, string> = {
  closed: 'Permanently closed',
  wrong_hours: 'Wrong hours',
  wrong_address: 'Wrong address',
  wrong_place: 'Wrong place',
  copyright: 'Copyright concern',
  inappropriate: 'Inappropriate content',
  quality: 'Poor quality',
  privacy: 'Privacy concern',
  other: 'Something else',
}

const reasonsForKind: Record<'place_error' | 'photo', Array<string>> = {
  place_error: ['closed', 'wrong_hours', 'wrong_address', 'wrong_place', 'other'],
  photo: ['copyright', 'inappropriate', 'quality', 'privacy', 'other'],
}

export const Route = createFileRoute('/report')({
  validateSearch: z.object({
    kind: z.enum(['photo', 'place_error']).default('place_error'),
    place: z.string().max(40).optional(),
    photo: z.coerce.number().int().positive().optional(),
  }),
  component: ReportPage,
  head: () => ({
    meta: seo({ title: 'Report a problem | MaineFoodMap' }),
  }),
})

function ReportPage() {
  const { kind, place, photo } = Route.useSearch()
  const submit = useServerFn(submitReport)
  const [reason, setReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reasons = reasonsForKind[kind]

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <p className={metaLabel({ className: 'text-ink-soft mb-4' })}>
          Maine Food Map
        </p>
        <h1 className={displayHeading({ className: 'text-5xl sm:text-6xl mb-10' })}>
          {kind === 'photo' ? 'Report a photo' : 'Report an error'}
        </h1>

        {done ? (
          <p className="text-lg text-ink-soft max-w-xl">
            Thank you — we review every report.
          </p>
        ) : (
          <form
            className="max-w-xl"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!reason) {
                setError('Please pick a reason.')
                return
              }
              setSubmitting(true)
              setError(null)
              try {
                await submit({
                  data: {
                    kind,
                    reason: reason as any,
                    details: details.trim() || undefined,
                    email: email.trim() || undefined,
                    restaurantPublicId: place,
                    photoId: photo,
                    website,
                  },
                })
                setDone(true)
              } catch (err) {
                setError(
                  err instanceof Error && err.message.includes('RATE_LIMITED')
                    ? 'Too many reports from this connection — please try again later.'
                    : 'Something went wrong submitting your report.',
                )
                setSubmitting(false)
              }
            }}
          >
            <section className="mb-8">
              <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-4' })}>
                Reason
              </h2>
              <div className="flex flex-col items-start gap-2">
                {reasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={toggleSegment({ active: reason === r })}
                  >
                    {reasonLabels[r]}
                  </button>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-4' })}>
                Details
              </h2>
              <label className={metaLabel({ className: 'block mb-2 text-ink-soft' })}>
                What should we know? (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={2000}
                rows={5}
                className={input()}
              />
            </section>

            <section className="mb-10">
              <h2 className={brandCaps({ className: 'text-sm text-ink-soft mb-4' })}>
                Contact
              </h2>
              <label className={metaLabel({ className: 'block mb-2 text-ink-soft' })}>
                Email, if you want a reply (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input()}
              />
              {/* Honeypot — hidden from real users, bots fill it */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />
            </section>

            {error && <p className="mb-5 text-sm text-tomato">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className={button({ intent: 'primary', className: 'disabled:opacity-50' })}
            >
              {submitting ? 'Sending…' : 'Send report'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
