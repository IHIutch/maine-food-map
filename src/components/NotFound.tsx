import { Link } from '@tanstack/react-router'
import { brandCaps, button, displayHeading } from './ui'

export function NotFound({ children }: { children?: any }) {
  return (
    <div className="max-w-xl mx-auto px-6 py-20">
      <p className={brandCaps({ className: 'text-sm text-ink-soft mb-4' })}>404 — Not found</p>
      <h1 className={displayHeading({ className: 'text-4xl mb-4' })}>
        This page is off the map.
      </h1>
      <div className="text-ink-soft mb-8">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => window.history.back()}
          className={button({ intent: 'primary' })}
        >
          Go back
        </button>
        <Link
          to="/"
          className={button({ intent: 'secondary' })}
        >
          Start over
        </Link>
      </p>
    </div>
  )
}
